import React, { useState } from 'react';

const AboutUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    query: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setSubmitMessage('');

  const formDataToSend = {
    access_key: "3c16eac8-1590-4f43-b3cb-fb19e95ce053",  // 🔹 Replace this with your actual key
    name: formData.name,
    email: formData.email,
    message: formData.query,
  };

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formDataToSend),
    });

    const data = await response.json();

    if (data.success) {
      setSubmitMessage("✅ Thank you for your message! We’ll get back to you soon.");
      setFormData({ name: '', email: '', query: '' });
    } else {
      setSubmitMessage(`❌ Failed to send: ${data.message || 'Unknown error.'}`);
    }
  } catch (error) {
    console.error("Error sending message:", error);
    setSubmitMessage("❌ Sorry, there was an error sending your message.");
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4 sm:py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-slate-600 rounded-full mb-4 border border-slate-300">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-slate-700 to-black bg-clip-text text-transparent mb-4">
            About Us
          </h1>
          <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto">
            We're passionate about revolutionizing medical waste management through AI-powered solutions
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 mb-12">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-blue-300 group">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 border border-blue-300 group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-black group-hover:text-blue-800 transition-colors duration-300">Our Mission</h2>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium group-hover:text-slate-800 transition-colors duration-300">
              To empower healthcare professionals with intelligent medical waste disposal solutions that ensure safety, 
              regulatory compliance, and environmental sustainability through cutting-edge AI technology.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-slate-400 group">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-3 border border-slate-300 group-hover:bg-slate-200 group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-slate-600 group-hover:text-slate-700 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-black group-hover:text-slate-800 transition-colors duration-300">Our Vision</h2>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium group-hover:text-slate-800 transition-colors duration-300">
              To be the global leader in AI-driven medical waste management, making proper disposal practices 
              accessible and effortless for healthcare facilities worldwide while protecting our environment.
            </p>
          </div>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-slate-600 rounded-full mb-4 border border-slate-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">Get in Touch</h2>
            <p className="text-slate-600 font-medium">Have questions or feedback? We'd love to hear from you!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-black mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 font-medium"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-black mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 font-medium"
                placeholder="Enter your email address"
              />
            </div>
            <div>
              <label htmlFor="query" className="block text-sm font-bold text-black mb-2">
                Your Message *
              </label>
              <textarea
                id="query"
                name="query"
                value={formData.query}
                onChange={handleInputChange}
                required
                rows={5}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 resize-none font-medium"
                placeholder="Tell us about your question, feedback, or how we can help you..."
              />
            </div>
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.email || !formData.query}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center mx-auto border border-slate-300"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Message
                  </>
                )}
              </button>
            </div>
            {submitMessage && (
              <div className={`text-center p-4 rounded-lg font-medium ${
                submitMessage.includes('Thank you') 
                  ? 'bg-green-50 text-green-800 border border-green-300' 
                  : 'bg-red-50 text-red-800 border border-red-300'
              }`}>
                {submitMessage}
              </div>
            )}
          </form>
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2 border border-blue-300">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-black">Location</h4>
                <p className="text-sm text-slate-600">Healthcare Innovation Hub</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-2 border border-slate-300">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h4 className="font-bold text-black">Phone</h4>
                <p className="text-sm text-slate-600">24/7 Support Available</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2 border border-blue-300">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-black">Response Time</h4>
                <p className="text-sm text-slate-600">Within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;