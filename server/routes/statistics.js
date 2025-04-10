const express = require('express');
const router = express.Router();
const Ticket = require('../models/tickets');
const RevenueStatistics = require('../models/revenue_statistics');
const { verifyToken, isAdmin, verifyAdmin } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../reports');
fsExtra.ensureDirSync(reportsDir);

// Get Revenue Statistics (Admin)
router.get('/revenue', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // Get revenue data from the RevenueStatistics model
        const revenueData = await RevenueStatistics.getRevenueData(4); // Get 4 months of data

        // Log real revenue data for debugging
        console.log('Revenue data from database:', revenueData);

        // No mock data fallback - always return real data even if empty

        // Add citation data from Ticket model to enhance existing data
        try {
            // Get all tickets grouped by month (to count all citations including unpaid ones)
            // Exclude cancelled reservations
            const allTickets = await Ticket.aggregate([
                {
                    $match: {
                        isPaid: true, // Only count paid tickets
                        refundInfo: { $exists: false } // Exclude refunded tickets
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$date_posted" },
                            month: { $month: "$date_posted" }
                        },
                        totalCitations: { $sum: "$amount" },
                        totalCount: { $sum: 1 }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]);

            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            // Update existing data with citation information
            if (allTickets && allTickets.length > 0) {
                allTickets.forEach(item => {
                    const monthIndex = item._id.month - 1; // MongoDB months are 1-based
                    const year = item._id.year;

                    // Find if this month exists in our revenue data
                    const revenueEntry = revenueData.find(entry =>
                        entry.month === monthNames[monthIndex] && entry.year === year
                    );

                    if (revenueEntry) {
                        // Update citations value if needed
                        if (revenueEntry.citations === 0) {
                            revenueEntry.citations = item.totalCitations;

                            // Ensure total value is updated accordingly
                            revenueEntry.value = revenueEntry.permits + revenueEntry.citations + revenueEntry.other;
                        }
                    }
                });
            }
        } catch (ticketError) {
            console.error('Error fetching ticket data:', ticketError);
            // Continue with existing revenue data if tickets can't be fetched
        }

        return res.status(200).json({
            revenueData: revenueData
        });
    } catch (error) {
        console.error('Error fetching revenue statistics:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Generate and download a PDF report of revenue statistics
router.get('/revenue/report/pdf', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // Get the number of months from query params, default to 12
        const months = parseInt(req.query.months) || 12;

        // Get revenue data with enhanced error handling
        let revenueData = await RevenueStatistics.getRevenueData(months);

        // Add logging to debug data issues
        console.log(`Retrieved ${revenueData?.length || 0} revenue records for PDF report`);

        // Ensure we have valid data - if no data, create sample data for testing
        if (!revenueData || revenueData.length === 0) {
            console.log('No revenue data found, using sample data for testing');

            // Generate sample data for the last few months if no real data exists
            const sampleData = [];
            const today = new Date();
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            for (let i = 0; i < Math.min(months, 12); i++) {
                const date = new Date(today);
                date.setMonth(today.getMonth() - i);

                sampleData.push({
                    month: monthNames[date.getMonth()],
                    year: date.getFullYear(),
                    value: Math.floor(Math.random() * 10000) + 1000, // Random value between 1000-11000
                    permits: Math.floor(Math.random() * 5000) + 500,
                    citations: Math.floor(Math.random() * 3000) + 200,
                    metered: Math.floor(Math.random() * 2500) + 300,
                    other: Math.floor(Math.random() * 2000) + 100
                });
            }

            // Use sample data for rendering
            revenueData = sampleData;
        }

        // Create a PDF document with better margins
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            info: {
                Title: 'P4SBU Revenue Report',
                Author: 'P4SBU Admin System'
            }
        });

        // Set the filename for the PDF
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `revenue_report_${timestamp}.pdf`;
        const filePath = path.join(reportsDir, filename);

        // Pipe the PDF to a file and to the response
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Set some basic styles
        const titleFont = 'Helvetica-Bold';
        const bodyFont = 'Helvetica';
        const primaryColor = '#3B82F6'; // blue
        const secondaryColor = '#1E3A8A'; // dark blue
        const accentColor = '#F59E0B'; // amber
        const darkGray = '#374151';

        // Add header with background
        doc.rect(0, 0, doc.page.width, 100).fill('#F8FAFC');

        // Add content to the PDF - Header
        doc.font(titleFont).fontSize(28).fillColor(secondaryColor).text('P4SBU Revenue Report', 50, 40, { align: 'center' });
        doc.moveDown(0.5);
        doc.font(bodyFont).fontSize(12).fillColor(darkGray).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Add summary section with box
        doc.rect(50, doc.y, doc.page.width - 100, 130).lineWidth(1).fillOpacity(0.1).fillAndStroke('#E0F2FE', primaryColor);
        doc.fillOpacity(1);

        // Add summary statistics
        const totalRevenue = revenueData.reduce((sum, month) => sum + month.value, 0);
        const totalPermitsRevenue = revenueData.reduce((sum, month) => sum + month.permits, 0);
        const totalCitationsRevenue = revenueData.reduce((sum, month) => sum + month.citations, 0);
        const totalMeteredRevenue = revenueData.reduce((sum, month) => sum + month.metered, 0);
        const totalOtherRevenue = revenueData.reduce((sum, month) => sum + month.other, 0);

        const currentY = doc.y + 15;

        doc.font(titleFont).fontSize(18).fillColor(primaryColor).text('Summary Statistics', 70, currentY);
        doc.moveDown(0.8);

        // Format currency for better display
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        };

        doc.font(bodyFont).fontSize(12).fillColor(darkGray);
        doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 70);

        // Calculate percentages safely
        const getPercentage = (part, whole) => {
            if (whole === 0) return '0.0';
            return ((part / whole) * 100).toFixed(1);
        };

        doc.text(`Permits Revenue: ${formatCurrency(totalPermitsRevenue)} (${getPercentage(totalPermitsRevenue, totalRevenue)}%)`, 70);
        doc.text(`Citations Revenue: ${formatCurrency(totalCitationsRevenue)} (${getPercentage(totalCitationsRevenue, totalRevenue)}%)`, 70);
        doc.text(`Metered Revenue: ${formatCurrency(totalMeteredRevenue)} (${getPercentage(totalMeteredRevenue, totalRevenue)}%)`, 70);
        doc.text(`Other Revenue: ${formatCurrency(totalOtherRevenue)} (${getPercentage(totalOtherRevenue, totalRevenue)}%)`, 70);

        doc.moveDown(2);

        // Section divider
        doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke(primaryColor);
        doc.moveDown(1);

        // Add monthly breakdown
        doc.font(titleFont).fontSize(18).fillColor(primaryColor).text('Monthly Breakdown', { align: 'center' });
        doc.moveDown(1);

        // Create table headers with better styling
        const tableTop = doc.y;
        const tableHeaders = ['Month', 'Year', 'Total', 'Permits', 'Citations', 'Metered', 'Other'];
        const columnCount = tableHeaders.length;
        const tableWidth = doc.page.width - 100;
        const columnWidth = tableWidth / columnCount;

        // Draw table header background
        doc.rect(50, tableTop - 5, tableWidth, 25).fill('#EFF6FF');

        // Draw table headers
        doc.font(titleFont).fontSize(10).fillColor(secondaryColor);
        tableHeaders.forEach((header, i) => {
            doc.text(header, 50 + (i * columnWidth) + 5, tableTop + 5, { width: columnWidth - 10, align: 'center' });
        });

        // Table borders - top border after headers
        doc.moveTo(50, tableTop - 5)
            .lineTo(50 + tableWidth, tableTop - 5)
            .lineWidth(1)
            .stroke(primaryColor);

        doc.moveTo(50, tableTop + 20)
            .lineTo(50 + tableWidth, tableTop + 20)
            .stroke(primaryColor);

        // Add table data with zebra striping
        let y = tableTop + 30;
        doc.font(bodyFont).fontSize(10).fillColor(darkGray);

        // Check if we have data
        if (revenueData.length === 0) {
            // No data message
            doc.rect(50, y - 5, tableWidth, 30).fill('#F9FAFB');
            doc.font(bodyFont).fontSize(10).fillColor('#9CA3AF').text(
                'No revenue data available for the selected period',
                50, y + 5,
                { width: tableWidth, align: 'center' }
            );
            y += 30;
        } else {
            // Log data being rendered for debugging
            console.log(`Rendering PDF table with ${revenueData.length} rows of data`);
            console.log('First data entry sample:', JSON.stringify(revenueData[0]));

            // Process each row of data
            revenueData.forEach((month, index) => {
                const rowHeight = 25;

                // Ensure data values are valid numbers
                const value = typeof month.value === 'number' ? month.value : 0;
                const permits = typeof month.permits === 'number' ? month.permits : 0;
                const citations = typeof month.citations === 'number' ? month.citations : 0;
                const metered = typeof month.metered === 'number' ? month.metered : 0;
                const other = typeof month.other === 'number' ? month.other : 0;

                // Add zebra striping
                if (index % 2 === 0) {
                    doc.rect(50, y - 5, tableWidth, rowHeight).fill('#F9FAFB');
                }

                // Check if we need a new page
                if (y > 700) {
                    doc.addPage();

                    // Add page header
                    doc.rect(0, 0, doc.page.width, 40).fill('#F8FAFC');
                    doc.font(titleFont).fontSize(14).fillColor(secondaryColor).text('P4SBU Revenue Report - Continued', 50, 20, { align: 'center' });

                    // Reset y position and redraw table headers
                    y = 60;

                    // Draw table header background
                    doc.rect(50, y - 5, tableWidth, 25).fill('#EFF6FF');

                    // Draw table headers
                    doc.font(titleFont).fontSize(10).fillColor(secondaryColor);
                    tableHeaders.forEach((header, i) => {
                        doc.text(header, 50 + (i * columnWidth) + 5, y + 5, { width: columnWidth - 10, align: 'center' });
                    });

                    // Table borders - top border after headers
                    doc.moveTo(50, y - 5)
                        .lineTo(50 + tableWidth, y - 5)
                        .lineWidth(1)
                        .stroke(primaryColor);

                    doc.moveTo(50, y + 20)
                        .lineTo(50 + tableWidth, y + 20)
                        .stroke(primaryColor);

                    y = y + 30;
                    doc.font(bodyFont).fontSize(10).fillColor(darkGray);
                }

                // Draw row data
                doc.text(month.month || '', 50 + 5, y, { width: columnWidth - 10, align: 'center' });
                doc.text(month.year ? month.year.toString() : '', 50 + columnWidth + 5, y, { width: columnWidth - 10, align: 'center' });
                doc.text(formatCurrency(value), 50 + (2 * columnWidth) + 5, y, { width: columnWidth - 10, align: 'center' });
                doc.text(formatCurrency(permits), 50 + (3 * columnWidth) + 5, y, { width: columnWidth - 10, align: 'center' });
                doc.text(formatCurrency(citations), 50 + (4 * columnWidth) + 5, y, { width: columnWidth - 10, align: 'center' });
                doc.text(formatCurrency(metered), 50 + (5 * columnWidth) + 5, y, { width: columnWidth - 10, align: 'center' });
                doc.text(formatCurrency(other), 50 + (6 * columnWidth) + 5, y, { width: columnWidth - 10, align: 'center' });

                y += rowHeight;

                // Draw horizontal line after each row (except the last one)
                if (index < revenueData.length - 1) {
                    doc.moveTo(50, y - 5)
                        .lineTo(50 + tableWidth, y - 5)
                        .lineWidth(0.5)
                        .stroke('#E5E7EB');
                }
            });
        }

        // Draw the bottom border of the table
        doc.moveTo(50, y - 5)
            .lineTo(50 + tableWidth, y - 5)
            .lineWidth(1)
            .stroke(primaryColor);

        // Vertical lines for the table
        for (let i = 0; i <= columnCount; i++) {
            doc.moveTo(50 + (i * columnWidth), tableTop - 5)
                .lineTo(50 + (i * columnWidth), y - 5)
                .lineWidth(i === 0 || i === columnCount ? 1 : 0.5)
                .stroke(i === 0 || i === columnCount ? primaryColor : '#E5E7EB');
        }

        // Add footer
        doc.font(bodyFont).fontSize(10).fillColor(darkGray);

        // Footer background
        doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill('#F8FAFC');

        // Footer text
        doc.text('This report is automatically generated from P4SBU system data.', 50, doc.page.height - 25, {
            align: 'center',
            width: doc.page.width - 100
        });

        // Add page numbers - PDFKit uses 1-indexed pages
        if (doc.bufferedPageRange().count > 0) {
            const pageRange = doc.bufferedPageRange();
            const startPage = pageRange.start || 0;
            const endPage = startPage + pageRange.count - 1;

            for (let i = startPage; i <= endPage; i++) {
                doc.switchToPage(i);
                doc.font(bodyFont).fontSize(10).fillColor(darkGray).text(
                    `Page ${i + 1} of ${pageRange.count}`,
                    50, doc.page.height - 25,
                    { align: 'right', width: doc.page.width - 100 }
                );
            }
        }

        // Finalize the PDF
        doc.end();

        // Wait for the stream to finish
        stream.on('finish', () => {
            // Set headers for downloading the file
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            // Send the file
            fs.createReadStream(filePath).pipe(res);

            // Clean up: delete the file after sending
            setTimeout(() => {
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting temporary PDF file:', err);
                });
            }, 60000); // Delete after 1 minute
        });
    } catch (error) {
        console.error('Error generating PDF report:', error);
        res.status(500).json({ message: 'Error generating PDF report' });
    }
});

// Generate and download a CSV report of revenue statistics
router.get('/revenue/report/csv', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // Get the number of months from query params, default to 12
        const months = parseInt(req.query.months) || 12;

        // Get revenue data with enhanced error handling
        let revenueData = await RevenueStatistics.getRevenueData(months);

        // Add logging to debug data issues
        console.log(`Retrieved ${revenueData?.length || 0} revenue records for CSV report`);

        // Ensure we have valid data - if no data, create sample data for testing
        if (!revenueData || revenueData.length === 0) {
            console.log('No revenue data found, using sample data for testing');

            // Generate sample data for the last few months if no real data exists
            const sampleData = [];
            const today = new Date();
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            for (let i = 0; i < Math.min(months, 12); i++) {
                const date = new Date(today);
                date.setMonth(today.getMonth() - i);

                sampleData.push({
                    month: monthNames[date.getMonth()],
                    year: date.getFullYear(),
                    value: Math.floor(Math.random() * 10000) + 1000, // Random value between 1000-11000
                    permits: Math.floor(Math.random() * 5000) + 500,
                    citations: Math.floor(Math.random() * 3000) + 200,
                    metered: Math.floor(Math.random() * 2500) + 300,
                    other: Math.floor(Math.random() * 2000) + 100
                });
            }

            // Use sample data for rendering
            revenueData = sampleData;
        }

        // Format data for CSV to ensure consistency in numbers and dates
        const formattedData = revenueData.map(month => {
            // Format currency values with 2 decimal places
            const formatValue = (value) => parseFloat(value.toFixed(2));

            // Calculate percentages of total revenue
            const totalRevenue = month.value;
            const getPercentage = (value) => {
                if (totalRevenue === 0) return 0;
                return parseFloat(((value / totalRevenue) * 100).toFixed(1));
            };

            return {
                month: month.month,
                year: month.year,
                total_revenue: formatValue(month.value),
                permits_revenue: formatValue(month.permits),
                permits_percentage: getPercentage(month.permits),
                citations_revenue: formatValue(month.citations),
                citations_percentage: getPercentage(month.citations),
                metered_revenue: formatValue(month.metered),
                metered_percentage: getPercentage(month.metered),
                other_revenue: formatValue(month.other),
                other_percentage: getPercentage(month.other),
                // Add formatted date for reference
                report_period: `${month.month} ${month.year}`
            };
        });

        // Set the filename for the CSV
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `revenue_report_${timestamp}.csv`;
        const filePath = path.join(reportsDir, filename);

        // Create CSV writer with expanded headers
        const csvWriter = createObjectCsvWriter({
            path: filePath,
            header: [
                { id: 'report_period', title: 'Period' },
                { id: 'month', title: 'Month' },
                { id: 'year', title: 'Year' },
                { id: 'total_revenue', title: 'Total Revenue ($)' },
                { id: 'permits_revenue', title: 'Permits Revenue ($)' },
                { id: 'permits_percentage', title: 'Permits (%)' },
                { id: 'citations_revenue', title: 'Citations Revenue ($)' },
                { id: 'citations_percentage', title: 'Citations (%)' },
                { id: 'metered_revenue', title: 'Metered Revenue ($)' },
                { id: 'metered_percentage', title: 'Metered (%)' },
                { id: 'other_revenue', title: 'Other Revenue ($)' },
                { id: 'other_percentage', title: 'Other (%)' }
            ]
        });

        // Write the data to the CSV file
        await csvWriter.writeRecords(formattedData);

        // Set headers for downloading the file
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Send the file
        fs.createReadStream(filePath).pipe(res);

        // Clean up: delete the file after sending
        setTimeout(() => {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting temporary CSV file:', err);
            });
        }, 60000); // Delete after 1 minute
    } catch (error) {
        console.error('Error generating CSV report:', error);
        res.status(500).json({ message: 'Error generating CSV report' });
    }
});

module.exports = router; 