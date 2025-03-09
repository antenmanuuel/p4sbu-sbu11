import React from "react";
import { useNavigate } from "react-router";

const StudentDashboard = ({ isAuthenticated, darkMode }) => {
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
    { date: "2024-01-10", description: "Semester Parking Permit", amount: "$125", status: "Paid" },
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
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Student Dashboard</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Permits</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activePermits.length}</p>
        </div>
        <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Citations</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{citations.length}</p>
        </div>
        <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Outstanding Balance</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>$50.00</p>
        </div>
      </div>

      {/* Active Permits */}
      <div className={`mt-6 p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Active Permits</h2>
        {activePermits.length === 0 ? (
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>You don't have any active permits.</p>
        ) : (
          activePermits.map((permit, index) => (
            <div key={index} className={`mb-4 p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{permit.type} - {permit.lot}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Valid Until: {permit.validUntil}</p>
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
      <div className={`mt-6 p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Citations</h2>
        {citations.length === 0 ? (
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>You don't have any citations.</p>
        ) : (
          <div className="space-y-4">
            {citations.map((citation, index) => (
              <div key={index} className={`p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{citation.violation}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Date: {citation.date}</p>
                    <p className={`font-medium mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{citation.amount}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(citation.status)}`}>
                    {citation.status}
                  </span>
                </div>
                <div className="mt-4 flex justify-end">
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium">
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className={`mt-6 p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Billing History</h2>
        {billingHistory.length === 0 ? (
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>You don't have any billing history.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Date</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Description</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Amount</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                {billingHistory.map((bill, index) => (
                  <tr key={index} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-800'}`}>{bill.date}</td>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-800'}`}>{bill.description}</td>
                    <td className={`px-6 py-4 whitespace-nowrap font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{bill.amount}</td>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-800'}`}>
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

