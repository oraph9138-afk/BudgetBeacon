import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";

function Home() {
  return (
    <main>
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Smart Cost Estimation for Your Business
            </h1>
            <p className="text-lg text-blue-100 mb-8">
              Get AI-powered cost estimates with confidence scores. Make smarter
              financial decisions for your business.
            </p>
            <Link
              to="/estimate"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Accurate Predictions</h3>
            <p className="text-gray-600 text-sm">
              Machine learning models trained on real business data to provide
              reliable cost estimates.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Confidence Scores</h3>
            <p className="text-gray-600 text-sm">
              Know how reliable each estimate is with our unique certainty
              prediction system.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fast & Accessible</h3>
            <p className="text-gray-600 text-sm">
              Get results in seconds via web app or USSD. No smartphone required.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Enter Data", desc: "Input your business costs and details" },
              { step: "2", title: "AI Analysis", desc: "Our models process your data instantly" },
              { step: "3", title: "Get Estimate", desc: "Receive cost prediction and confidence" },
              { step: "4", title: "Make Decisions", desc: "Use insights to plan your business" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
