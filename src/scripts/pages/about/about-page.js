export default class AboutPage {
  async render() {
    return `
      <section class="container about-section">
        <h1 class="about-title">About Me</h1>
        
        <div class="about-content">
          <div class="profile-section">
            <img src="/images/pp.jpg" alt="Profile Picture" class="profile-image">
            <h2 class="profile-name">Muhammad Irza Alfarizi</h2>
            <p class="profile-title">Web Developer</p>
          </div>

          <div class="bio-section">
            <p class="bio-text">
              Hello! I am Muhammad Irza Alfarizi, usually people call me by Irza, a computer science undergraduate from University of Gunadarma. I am a Tech enthusiast & 3D Blender Modeler.
            </p>
            
            <div class="skills-section">
              <h3>Skills</h3>
              <ul class="skills-list">
                <li><i class="fab fa-js"></i> JavaScript</li>
                <li><i class="fab fa-html5"></i> HTML & <i class="fab fa-css3-alt"></i> CSS</li>
                <li><i class="fab fa-react"></i> React</li>
                <li><i class="fab fa-node-js"></i> Node.js</li>
                <li><i class="fas fa-cube"></i> Blender</li>
              </ul>
            </div>

            <div class="contact-section">
              <h3>Get In Touch</h3>
              <div class="social-links">
                <a href="https://github.com/farizirza" target="_blank" rel="noopener" class="social-link">
                  <i class="fab fa-github"></i> GitHub
                </a>
                <a href="https://linkedin.com/in/farizirza" target="_blank" rel="noopener" class="social-link">
                  <i class="fab fa-linkedin"></i> LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Animations could be added here if needed
  }
}
