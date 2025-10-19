import React from "react";
import { NavLink, Link, useNavigate } from 'react-router-dom';


function Footer() {
 return(
<>
 <footer className="bg-dark text-white py-4 mt-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="mb-0">
             
                © Quakesight. All rights reserved.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-0">
               Privacy  | Terms of Service
              </p>
            </div>
          </div>
        </div>
      </footer>
</>

 );
}

export default Footer;