import React from "react";
import { useNavigate } from "react-router";

const FacultyDashboard = ({user, isAuthenticated}) => {
  if(!isAuthenticated){
    useNavigate('/');
    console.log(isAuthenticated);
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Dashboard Content */}
      <div className="mt-6">
        <h1 className="text-3xl font-bold">Faculty Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white p-6 shadow-md rounded-lg">
            <p className="text-gray-600">Active Permits</p>
            <p className="text-2xl font-bold">{activePermits.length}</p>
          </div>
          <div className="bg-white p-6 shadow-md rounded-lg">
            <p className="text-gray-600">Citations</p>
            <p className="text-2xl font-bold">{citations.length}</p>
          </div>
          <div className="bg-white p-6 shadow-md rounded-lg">
            <p className="text-gray-600">Outstanding Balance</p>
            <p className="text-2xl font-bold">$50.00</p>
          </div>
        </div>

        {/* Active Permits */}
        <div className="mt-6 bg-white p-6 shadow-md rounded-lg">
          <h2 className="text-xl font-bold">Active Permits</h2>
          {activePermits.map((permit, index) => (
            <div key={index} className="mt-2 border-t pt-2">
              <p>{permit.type} - {permit.lot}</p>
              <p>Valid Until: {permit.validUntil}</p>
              <span className="bg-gray-300 px-4 py-1 rounded">{permit.status}</span>
            </div>
          ))}
        </div>

        {/* Citations */}
        <div className="mt-6 bg-white p-6 shadow-md rounded-lg">
          <h2 className="text-xl font-bold">Citations</h2>
          {citations.map((citation, index) => (
            <div key={index} className="mt-2 border-t pt-2">
              <p>Date: {citation.date}</p>
              <p>Violation: {citation.violation}</p>
              <p>Amount: {citation.amount}</p>
              <span className="bg-red-500 text-white px-4 py-1 rounded">{citation.status}</span>
            </div>
          ))}
        </div>

        {/* Billing History */}
        <div className="mt-6 bg-white p-6 shadow-md rounded-lg">
          <h2 className="text-xl font-bold">Billing History</h2>
          {billingHistory.map((bill, index) => (
            <div key={index} className="mt-2 border-t pt-2">
              <p>Date: {bill.date}</p>
              <p>Description: {bill.description}</p>
              <p>Amount: {bill.amount}</p>
              <span className="bg-green-500 text-white px-4 py-1 rounded">{bill.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;

