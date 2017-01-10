import React from 'react';
import Navbar from '../common/navbar';

class NavBar extends React.Component {
  render() {
    return (
      <div>
        <div className="title-2 underline" id="navbar">NAVBAR</div>
        <section>
          <Navbar />
        </section>
        <section>
          <div className="title-3">Code</div>
          <div className="box">
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>Navbar /</span>
                <span>&gt;</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default NavBar;