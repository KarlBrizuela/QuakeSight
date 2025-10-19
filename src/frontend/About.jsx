import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function About() {
  const frontendTech = [
    {
      name: "React",
      description: "Modern JavaScript library for building user interfaces",
      icon: "fab fa-react text-info",
      bgColor: "bg-info bg-opacity-10"
    },
    {
      name: "Bootstrap 5",
      description: "Powerful, extensible frontend toolkit",
      icon: "fab fa-bootstrap text-purple",
      bgColor: "bg-purple bg-opacity-10"
    },
    {
      name: "JavaScript ES6+",
      description: "Programming language for interactive features",
      icon: "fab fa-js-square text-warning",
      bgColor: "bg-warning bg-opacity-10"
    },
    {
      name: "HTML5 & CSS3",
      description: "Modern web standards and styling",
      icon: "fab fa-html5 text-danger",
      bgColor: "bg-danger bg-opacity-10"
    }
  ];

  const dataSources = [
    {
      name: "Philippine Statistics Authority (PSA)",
      url: "https://psa.gov.ph",
      description: "Official statistical information and demographic data",
      icon: "fas fa-chart-bar text-primary",
      featureIcon: "fas fa-landmark"
    },
    {
      name: "PHIVOLCS",
      url: "https://www.phivolcs.dost.gov.ph",
      description: "Geological, volcanic, and seismic data including earthquake information",
      icon: "fas fa-volcano text-danger",
      featureIcon: "fas fa-mountain"
    },
    {
      name: "Philippine Statistics Geographic Code (PSGC)",
      url: "https://psa.gov.ph/classification/psgc",
      description: "Standard geographic codes for Philippine regions and provinces",
      icon: "fas fa-map-marked-alt text-success",
      featureIcon: "fas fa-map-pin"
    },
    {
      name: "United States Geological Survey (USGS)",
      url: "https://www.usgs.gov",
      description: "Global seismic data and earthquake monitoring information",
      icon: "fas fa-globe-americas text-info",
      featureIcon: "fas fa-satellite"
    },
    {
      name: "PhilAtlas",
      url: "https://www.philatlas.com",
      description: "Comprehensive geographical information about Philippine locations",
      icon: "fas fa-atlas text-warning",
      featureIcon: "fas fa-book-atlas"
    }
  ];

  const features = [
    {
      icon: "fas fa-database text-primary",
      title: "Reliable Data",
      description: "Sourced from official government agencies"
    },
    {
      icon: "fas fa-bolt text-warning",
      title: "Fast Access",
      description: "Quick and easy data retrieval"
    },
    {
      icon: "fas fa-mobile-alt text-info",
      title: "Responsive",
      description: "Works perfectly on all devices"
    },
    {
      icon: "fas fa-sync text-success",
      title: "Regular Updates",
      description: "Always current information"
    }
  ];

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      
      {/* Hero Section */}
      <header className="bg-primary bg-gradient text-white py-5">
        <div className="container">
          <div className="row py-5">
            <div className="col-lg-8 mx-auto text-center">
              <div className="mb-4">
                <i className="fas fa-map-marked-alt fa-4x text-white-50 mb-4"></i>
              </div>
              <h1 className="display-4 fw-bold mb-4">About Quakesight</h1>
              <p className="lead mb-4 fs-5">
                <i className="fas fa-star text-warning me-2"></i>
                Your comprehensive source for seismic and geographical data in the Philippines
                <i className="fas fa-star text-warning ms-2"></i>
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <span className="badge bg-light text-primary fs-6 p-2">
                  <i className="fas fa-check-circle me-1"></i> Data From Usgs
                </span>
                <span className="badge bg-light text-primary fs-6 p-2">
                  <i className="fas fa-check-circle me-1"></i> Easy to Use
                </span>
                <span className="badge bg-light text-primary fs-6 p-2">
                  <i className="fas fa-check-circle me-1"></i> Always Updated
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow-1">
        <div className="container my-5">
          {/* Features Section */}
          <section className="mb-5">
            <div className="row g-4">
              {features.map((feature, index) => (
                <div key={index} className="col-md-6 col-lg-3">
                  <div className="card border-0 shadow-sm h-100 text-center">
                    <div className="card-body p-4">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                           style={{width: '80px', height: '80px'}}>
                        <i className={`${feature.icon} fa-2x`}></i>
                      </div>
                      <h5 className="fw-bold text-dark">{feature.title}</h5>
                      <p className="text-muted small mb-0">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mission Section */}
          <section className="mb-5">
            <div className="row">
              <div className="col-lg-10 mx-auto">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4 p-md-5">
                    <div className="row align-items-center">
                      <div className="col-md-3 text-center mb-4 mb-md-0">
                        <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center" 
                             style={{width: '120px', height: '120px'}}>
                          <i className="fas fa-bullseye fa-3x text-white"></i>
                        </div>
                      </div>
                      <div className="col-md-9">
                        <div className="d-flex align-items-center mb-3">
                          <i className="fas fa-flag text-primary fa-2x me-3"></i>
                          <h2 className="h2 fw-bold text-dark mb-0">Our Mission</h2>
                        </div>
                        <p className="fs-5 text-muted mb-0">
                          We provide a centralized platform for accessing reliable Philippine seismic 
                          and geographical data. Our goal is to make this information easily accessible 
                          to researchers, students, developers, and anyone interested in Philippine seismic activity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Technology Section */}
          <section className="mb-5">
            <div className="row mb-4">
              <div className="col-lg-8 mx-auto text-center">
                <div className="d-flex align-items-center justify-content-center mb-3">
                  <i className="fas fa-laptop-code text-primary fa-2x me-3"></i>
                  <h2 className="h1 fw-bold text-dark mb-0">Technology We Use</h2>
                </div>
                <p className="fs-5 text-muted">
                  Built with modern frontend technologies for the best user experience
                </p>
              </div>
            </div>

            <div className="row g-4">
              {frontendTech.map((tech, index) => (
                <div key={tech.name} className="col-md-6 col-lg-3">
                  <div className="card h-100 border-0 shadow-sm h-100 transition-all">
                    <div className="card-body text-center p-4">
                      <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3 ${tech.bgColor}`} 
                           style={{width: '80px', height: '80px'}}>
                        <i className={`${tech.icon} fa-2x`}></i>
                      </div>
                      <h5 className="card-title fw-bold text-dark">{tech.name}</h5>
                      <p className="card-text text-muted small">{tech.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Data Sources Section */}
          <section className="mb-5">
            <div className="row mb-4">
              <div className="col-lg-8 mx-auto text-center">
                <div className="d-flex align-items-center justify-content-center mb-3">
                  <i className="fas fa-database text-primary fa-2x me-3"></i>
                  <h2 className="h1 fw-bold text-dark mb-0">Our Data Sources</h2>
                </div>
                <p className="fs-5 text-muted">
                  We gather information from trusted and authoritative sources
                </p>
              </div>
            </div>

            <div className="row g-4">
              {dataSources.map((source, index) => (
                <div key={source.name} className="col-lg-6">
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-decoration-none"
                  >
                    <div className="card h-100 border-0 shadow-sm h-100 transition-all">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-start">
                          <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-4" 
                               style={{width: '60px', height: '60px', minWidth: '60px'}}>
                            <i className={`${source.featureIcon} text-primary fa-lg`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <i className={`${source.icon} me-2`}></i>
                              <h5 className="card-title fw-bold text-dark mb-0">
                                {source.name}
                              </h5>
                            </div>
                            <p className="card-text text-muted mb-3">
                              {source.description}
                            </p>
                            <div className="d-flex align-items-center text-primary">
                              <i className="fas fa-external-link-alt me-2 small"></i>
                              <span className="fw-semibold">Visit Official Website</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Data Accuracy Section */}
          <section className="mb-5">
            <div className="row">
              <div className="col-lg-10 mx-auto">
                <div className="card bg-light border-0">
                  <div className="card-body p-4 p-md-5">
                    <div className="row align-items-center">
                      <div className="col-md-2 text-center mb-4 mb-md-0">
                        <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center" 
                             style={{width: '100px', height: '100px'}}>
                          <i className="fas fa-shield-alt fa-2x text-white"></i>
                        </div>
                      </div>
                      <div className="col-md-10">
                        <div className="d-flex align-items-center mb-3">
                          <i className="fas fa-award text-success fa-2x me-3"></i>
                          <h2 className="h2 fw-bold text-dark mb-0">Data Accuracy & Updates</h2>
                        </div>
                        <p className="fs-5 text-muted mb-0">
                          We regularly update our information from the official sources to ensure accuracy. 
                          For the most current data, we recommend visiting the original websites directly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Acknowledgments Section */}
          <section>
            <div className="row">
              <div className="col-lg-10 mx-auto">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4 p-md-5 text-center">
                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" 
                         style={{width: '100px', height: '100px'}}>
                      <i className="fas fa-hands-helping fa-2x text-primary"></i>
                    </div>
                    <h2 className="h2 fw-bold text-dark mb-3">Acknowledgments</h2>
                    <p className="fs-5 text-muted mb-0">
                      We extend our gratitude to all organizations that provide public access to their data. 
                      Their commitment to transparency makes platforms like ours possible.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer - This should now appear at the bottom */}
      <Footer />

      {/* Custom CSS */}
      <style jsx>{`
        .transition-all {
          transition: all 0.3s ease;
        }
        .transition-all:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
        .bg-gradient {
          background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%) !important;
        }
        .text-purple {
          color: #6f42c1 !important;
        }
        .bg-purple {
          background-color: #6f42c1 !important;
        }
      `}</style>
    </div>

   
  );
}

export default About;