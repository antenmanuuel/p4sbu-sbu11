import React from "react";
import { useNavigate } from "react-router";
import { Bar } from "recharts";

const Card = ({ children }) => {
    return <div className="p-4 border rounded-lg shadow-sm">{children}</div>;
};

const AdminDashboard = ({darkMode, user, isAuthenticated}) => {
  if(!isAuthenticated){
    useNavigate('/');
    console.log(isAuthenticated);
  }
  const revenueData = [
    { month: "Jan", value: 38 },
    { month: "Feb", value: 40 },
    { month: "Mar", value: 41 },
    { month: "Apr", value: 42 },
  ];

  const pendingUsers = [
    { name: "John Doe", email: "john@example.com", userType: "Student" },
    { name: "Jane Smith", email: "jane@example.com", userType: "Faculty" },
    { name: "Alice Johnson", email: "alice@example.com", userType: "Faculty" },
  ];

  const revenue = 38186;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-4 gap-4 my-6">
        <Card className="p-4">Total Users<br/>0 - Click to view all users</Card>
        <Card className="p-4">Revenue<br/>${revenue} - Click for detailed breakdown</Card>
        <Card className="p-4">Active Permits<br/>0 - Currently active permits</Card>
        <Card className="p-4">Total Lots<br/>0 - Click to view all lots</Card>
      </div>
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold">Revenue Overview</h2>
        <div className="flex gap-4 mt-2">
          {revenueData.map((data, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="bg-gray-300 w-6 h-24" style={{ height: `${data.value}px` }}></div>
              <span className="text-sm mt-2">{data.month}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold">Pending Approvals</h2>
        <table className="w-full mt-2 border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">User Type</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((user, index) => (
              <tr key={index}>
                <td className="border p-2">{user.name}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.userType}</td>
                <td className="border p-2"><button className="bg-blue-500 text-white px-2 py-1 rounded">Approve</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
