import React from "react";
import { useNavigate } from "react-router";

const StudentDashboard = ({ isAuthenticated }) => {
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/');
  }

  const activePermits = [
    { type: "No Permit", lot: "Lot 2", validUntil: "2024-12-31", status: "Active" },
  ];

  const citations = [
    { date: "2024-03-15", violation: "No Valid Permit", amount: "$50", status: "Unpaid" },
    { date: "2024-02-26", violation: "Incorrect Spot", amount: "$75", status: "Unpaid" }
  ];

  const billingHistory = [
    { date: "2024-03-01", description: "Spring 2024 Parking Permit", amount: "$135", status: "Paid" },
  ];

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border border-gray-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "paid":
        return "bg-green-100 text-green-800 border border-green-200";
      case "unpaid":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Student Dashboard</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-gray-600 text-sm font-medium">Active Permits</p>
          <p className="text-2xl font-bold mt-1">{activePermits.length}</p>
        </div>
        <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-gray-600 text-sm font-medium">Citations</p>
          <p className="text-2xl font-bold mt-1">{citations.length}</p>
        </div>
        <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-gray-600 text-sm font-medium">Outstanding Balance</p>
          <p className="text-2xl font-bold mt-1">$50.00</p>
        </div>
      </div>

      {/* Active Permits */}
      <div className="mt-6 bg-white p-6 shadow-sm rounded-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Active Permits</h2>
        {activePermits.length === 0 ? (
          <p className="text-gray-500">You don't have any active permits.</p>
        ) : (
          activePermits.map((permit, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-100 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{permit.type} - {permit.lot}</p>
                  <p className="text-sm text-gray-600">Valid Until: {permit.validUntil}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(permit.status)}`}>
                  {permit.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Citations */}
      <div className="mt-6 bg-white p-6 shadow-sm rounded-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Citations</h2>
        {citations.length === 0 ? (
          <p className="text-gray-500">You don't have any citations.</p>
        ) : (
          <div className="space-y-4">
            {citations.map((citation, index) => (
              <div key={index} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{citation.violation}</p>
                    <p className="text-sm text-gray-600">Date: {citation.date}</p>
                    <p className="font-medium text-gray-900 mt-2">{citation.amount}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(citation.status)}`}>
                    {citation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className="mt-6 bg-white p-6 shadow-sm rounded-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Billing History</h2>
        {billingHistory.length === 0 ? (
          <p className="text-gray-500">You don't have any billing history.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billingHistory.map((bill, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{bill.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{bill.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{bill.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(bill.status)}`}>
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;

