import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import { Link } from 'react-router-dom';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Analysis = () => {
  const YEARS_TO_SHOW = 9;
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthlyView, setShowMonthlyView] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [showColorBreakdown, setShowColorBreakdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const colorBreakdownRef = useRef(null);
  const monthlyChartRef = useRef(null);
  const classBreakdownRef = useRef(null);

  // Fetch available years
  const fetchYears = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/analytics/yearly?years=${YEARS_TO_SHOW}`, { timeout: 10000 });
      setAvailableYears(res.data.map(y => y[0]).sort((a, b) => b - a));
    } catch (err) {
      console.error('Error fetching years:', err);
      setError('Failed to fetch available years.');
    }
  };

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summaryResponse = await axios.get('http://localhost:8000/api/analytics/summary', { timeout: 10000 });
      const yearlyResponse = await axios.get(`http://localhost:8000/api/analytics/yearly?years=${YEARS_TO_SHOW}`, { timeout: 10000 });
      const monthlyResponse = await axios.get(`http://localhost:8000/api/analytics/monthly/${selectedYear}`, { timeout: 10000 });
      const colorResponse = await axios.get(`http://localhost:8000/api/analytics/color-breakdown/${selectedYear}/${selectedMonth}`, { timeout: 10000 });
      const classResponse = await axios.get(`http://localhost:8000/api/analytics/class-breakdown/${selectedYear}/${selectedMonth}`, { timeout: 10000 });

      console.log('Summary Response:', summaryResponse.data);
      console.log('Yearly Trends Response:', yearlyResponse.data);
      console.log('Monthly Response:', monthlyResponse.data);
      console.log('Color Breakdown Response:', colorResponse.data);
      console.log('Class Breakdown Response:', classResponse.data);

      const summary = summaryResponse.data;
      const yearlyTrends = yearlyResponse.data.map(([year, count]) => ({ year: year.toString(), classifications: count }));
      const monthlyBreakdown = monthlyResponse.data;
      const colorDistribution = colorResponse.data;
      const classDistribution = classResponse.data;

      const currentMonth = months[new Date().getMonth()];
      const currentYear = new Date().getFullYear();
      const currentMonthPercentage = summary.monthly_percentages[currentMonth] || 0;

      setAnalyticsData({
        totalClassifications: summary.total_classifications,
        mostCommonClass: summary.most_common_class,
        currentMonthPercentage,
        yearlyTrends,
        monthlyBreakdown,
        colorDistribution,
        classDistribution,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch analytics data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
    fetchAnalyticsData();
  }, [selectedYear, selectedMonth]);

  // Chart data
  const yearlyChartData = analyticsData ? analyticsData.yearlyTrends : [];
  const monthlyChartData = analyticsData ? analyticsData.monthlyBreakdown : [];
  const colorChartData = analyticsData ? analyticsData.colorDistribution : [];
  const classChartData = analyticsData ? analyticsData.classDistribution : [];
  const maxYearly = yearlyChartData.length > 0 ? Math.max(...yearlyChartData.map(item => item.classifications)) : 0;
  const maxMonthly = monthlyChartData.length > 0 ? Math.max(...monthlyChartData.map(item => item.classifications)) : 0;
  const maxColorPercentage = colorChartData.length > 0 ? Math.max(...colorChartData.map(item => item.percentage)) : 0;
  const maxClassPercentage = classChartData.length > 0 ? Math.max(...classChartData.map(item => item.percentage)) : 0;

  // Handlers
  const handleBarClick = (data) => {
    if (data && data.year) {
      setSelectedYear(data.year);
      setShowMonthlyView(true);
      setTimeout(() => monthlyChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  };

  const handleDotClick = (data) => {
    if (data && data.month) {
      setSelectedMonth(data.month);
      setShowColorBreakdown(true);
      setTimeout(() => {
        colorBreakdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => classBreakdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      }, 100);
    }
  };

  const handleBackToYearly = () => {
    setSelectedYear(new Date().getFullYear());
    setShowMonthlyView(false);
    setSelectedMonth(months[new Date().getMonth()]);
    setShowColorBreakdown(false);
  };

  const handleClearMonthSelection = () => {
    setSelectedMonth(months[new Date().getMonth()]);
    setShowColorBreakdown(false);
  };

  // Custom Dot for Line Chart
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill="#3b82f6"
        stroke="#fff"
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
        onClick={() => handleDotClick(payload)}
        onMouseEnter={(e) => {
          e.target.setAttribute('r', 12);
          e.target.style.fill = '#2563eb';
        }}
        onMouseLeave={(e) => {
          e.target.setAttribute('r', 8);
          e.target.style.fill = '#3b82f6';
        }}
      />
    );
  };

  const CustomActiveDot = (props) => {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={12}
        fill="#2563eb"
        stroke="#fff"
        strokeWidth={3}
        style={{ cursor: 'pointer' }}
        onClick={() => handleDotClick(payload)}
      />
    );
  };

  // Custom Tooltips
  const CustomYearlyTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white px-3 py-2 rounded shadow-lg">
          <p className="font-bold">{payload[0].payload.year}</p>
          <p className="text-sm">Classifications: {payload[0].value}</p>
          <p className="text-xs text-blue-300 mt-1">Click to see monthly data</p>
        </div>
      );
    }
    return null;
  };

  const CustomMonthlyTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white px-3 py-2 rounded shadow-lg">
          <p className="font-bold">{payload[0].payload.month} {selectedYear}</p>
          <p className="text-sm">Classifications: {payload[0].value}</p>
          <p className="text-xs text-blue-300 mt-1">Click to see color and class breakdown</p>
        </div>
      );
    }
    return null;
  };

  const CustomColorTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white px-3 py-2 rounded shadow-lg">
          <p className="font-bold">{payload[0].payload.color}</p>
          <p className="text-sm">Count: {payload[0].payload.count}</p>
          <p className="text-sm">Percentage: {payload[0].payload.percentage}%</p>
          <p className="text-xs">{payload[0].payload.description}</p>
        </div>
      );
    }
    return null;
  };

  const CustomClassTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white px-3 py-2 rounded shadow-lg">
          <p className="font-bold">{payload[0].payload.class}</p>
          <p className="text-sm">Count: {payload[0].payload.count}</p>
          <p className="text-sm">Percentage: {payload[0].payload.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const yearRangeText = availableYears.length > 0 ? `${availableYears[availableYears.length - 1]}-${availableYears[0]}` : '';

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4 sm:py-6 md:py-8">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-slate-600 rounded-full mb-4 border border-slate-300">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-slate-700 to-black bg-clip-text text-transparent mb-2 sm:mb-4">
          Medical Waste Analytics
        </h1>
        <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto">
          Comprehensive analysis of medical waste classifications and disposal patterns
        </p>
      </div>

      {/* Loading and Error States */}
      {isLoading && (
        <div className="text-center mb-8">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-600 mt-2">Loading analytics...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl shadow-md mb-8">
          <h3 className="text-lg font-bold text-red-700 mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Analytics Content */}
      {analyticsData && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-blue-300">
              <h3 className="text-lg font-bold text-black mb-2 flex items-center">
                Total Classifications
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{analyticsData.totalClassifications.toLocaleString()}</p>
              <p className="text-sm text-slate-600 font-medium">From Firebase data</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-blue-300">
              <h3 className="text-lg font-bold text-black mb-2 flex items-center">
                {months[new Date().getMonth()]} {new Date().getFullYear()} Percentage
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{analyticsData.currentMonthPercentage}%</p>
              <p className="text-sm text-slate-600 font-medium">Of total classifications</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-blue-300">
              <h3 className="text-lg font-bold text-black mb-2 flex items-center">
                Most Common Class
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{analyticsData.mostCommonClass}</p>
              <p className="text-sm text-slate-600 font-medium">Dominant waste type</p>
            </div>
          </div>

          {/* Yearly Trends */}
          <div className="w-full mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-300">
              <h3 className="text-xl font-bold text-black mb-4 flex items-center">
                Annual Classification Trends ({yearRangeText})
              </h3>
              <div className="h-96 bg-slate-50 rounded-lg border border-slate-200 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" tick={{ fill: '#475569', fontWeight: 'bold' }} axisLine={{ stroke: '#94a3b8' }} />
                    <YAxis tick={{ fill: '#475569', fontWeight: 'bold' }} axisLine={{ stroke: '#94a3b8' }} />
                    <Tooltip content={<CustomYearlyTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                    <Bar dataKey="classifications" radius={[8, 8, 0, 0]} cursor="pointer" onClick={handleBarClick}>
                      {yearlyChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={selectedYear === entry.year ? "#2563eb" : "#3b82f6"}
                          stroke={selectedYear === entry.year ? "#1d4ed8" : "transparent"}
                          strokeWidth={selectedYear === entry.year ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-slate-600">
                    Click on any bar to view detailed monthly trend line chart
                    {selectedYear && (
                      <span className="ml-2 font-bold text-blue-600">
                        (Currently showing: {selectedYear})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          {showMonthlyView && monthlyChartData.length > 0 && (
            <div ref={monthlyChartRef} className="w-full mb-8">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-300 animate-fade-in">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-xl font-bold text-black flex items-center">
                    Monthly Trends for {selectedYear}
                  </h3>
                  <div className="text-base font-bold text-blue-600">
                    Total: {monthlyChartData.reduce((sum, item) => sum + item.classifications, 0)}
                  </div>
                </div>
                <div className="h-96 bg-slate-50 rounded-lg border border-slate-200 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fill: '#475569', fontWeight: 'bold', fontSize: 12 }} axisLine={{ stroke: '#94a3b8' }} />
                      <YAxis tick={{ fill: '#475569', fontWeight: 'bold' }} axisLine={{ stroke: '#94a3b8' }} />
                      <Tooltip content={<CustomMonthlyTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
                      <Line
                        type="monotone"
                        dataKey="classifications"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={<CustomDot />}
                        activeDot={<CustomActiveDot />}
                        name="Classifications"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-600 mb-1">Peak Month</p>
                      <p className="text-sm font-bold text-blue-600">
                        {monthlyChartData.reduce((prev, current) =>
                          (prev.classifications > current.classifications) ? prev : current
                        ).month}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-600 mb-1">Average</p>
                      <p className="text-sm font-bold text-slate-700">
                        {Math.round(monthlyChartData.reduce((sum, item) => sum + item.classifications, 0) / monthlyChartData.length)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-600 mb-1">Lowest Month</p>
                      <p className="text-sm font-bold text-slate-700">
                        {monthlyChartData.reduce((prev, current) =>
                          (prev.classifications < current.classifications) ? prev : current
                        ).month}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Color and Class Breakdown */}
          {showColorBreakdown && (
            <div className="w-full mb-8">
              {/* Color Distribution */}
              <div ref={colorBreakdownRef} className="bg-white p-4 sm:p-6 rounded-xl shadow-xl border-2 border-blue-300 animate-fade-in mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-black flex items-center">
                    Color Distribution - {selectedMonth} {selectedYear}
                  </h3>
                  <button
                    onClick={handleClearMonthSelection}
                    className="text-sm text-slate-600 hover:text-slate-800 font-medium flex items-center px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Month
                  </button>
                </div>
                <div className="h-96 bg-slate-50 rounded-lg border border-slate-200 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={colorChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="color" tick={{ fill: '#475569', fontWeight: 'bold', fontSize: 12 }} axisLine={{ stroke: '#94a3b8' }} />
                      <YAxis 
                        tick={{ fill: '#475569', fontWeight: 'bold' }} 
                        axisLine={{ stroke: '#94a3b8' }} 
                        label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', offset: -5, fill: '#475569' }}
                      />
                      <Tooltip content={<CustomColorTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                      <Bar dataKey="percentage" radius={[8, 8, 0, 0]} maxBarSize={60}>
                        {colorChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.color.toLowerCase() === 'red' ? '#EF4444' :
                              entry.color.toLowerCase() === 'blue' ? '#3B82F6' :
                              entry.color.toLowerCase() === 'yellow' ? '#EAB308' :
                              '#1F2937'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 pt-6 border-t-2 border-slate-200">
                  <h4 className="text-lg font-bold text-slate-800 mb-4 text-center">
                    Medical Waste Color Code System - {selectedMonth} {selectedYear}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {colorChartData.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-3 ${
                          item.color.toLowerCase() === 'red' ? 'bg-red-600' :
                          item.color.toLowerCase() === 'blue' ? 'bg-blue-600' :
                          item.color.toLowerCase() === 'yellow' ? 'bg-yellow-500' :
                          'bg-slate-800'
                        }`}></div>
                        <span className="font-semibold">{item.color}:</span>
                        <span className="ml-2 text-slate-600">{item.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top 5 Classes Distribution */}
              <div ref={classBreakdownRef} className="bg-white p-4 sm:p-6 rounded-xl shadow-xl border-2 border-blue-300 animate-fade-in">
                <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                  Top 5 Classes Distribution - {selectedMonth} {selectedYear}
                </h3>
                <div className="h-96 bg-slate-50 rounded-lg border border-slate-200 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="class" 
                        tick={{ fill: '#475569', fontWeight: 'bold', fontSize: 12 }} 
                        axisLine={{ stroke: '#94a3b8' }} 
                        interval={0}
                        tickFormatter={(value) => value.length > 15 ? value.substring(0, 12) + '...' : value}
                      />
                      <YAxis 
                        tick={{ fill: '#475569', fontWeight: 'bold' }} 
                        axisLine={{ stroke: '#94a3b8' }} 
                        label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', offset: -5, fill: '#475569' }}
                      />
                      <Tooltip content={<CustomClassTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                      <Bar dataKey="percentage" radius={[8, 8, 0, 0]} maxBarSize={60}>
                        {classChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={['#EF4444', '#3B82F6', '#EAB308', '#1F2937', '#10B981'][index % 5]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 pt-6 border-t-2 border-slate-200">
                  <h4 className="text-lg font-bold text-slate-800 mb-4">Top Classes Details</h4>
                  <ul className="list-disc pl-5 text-black font-medium">
                    {classChartData.map((cls, index) => (
                      <li key={index}>
                        {cls.class}: {cls.count} ({cls.percentage}%)
                      </li>
                    ))}
                    {classChartData.length === 0 && (
                      <li>No classifications for this period</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            width: 0%;
          }
          to {
            width: var(--target-width);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Analysis;