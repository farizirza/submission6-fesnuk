class HomePage {
  constructor(storyModel) {
    this.storyModel = storyModel;
  }

  async render() {
    return `
      <section class="container">
        <h1>Home Page</h1>
      </section>
    `;
  }

  async afterRender() {
    // Do your job here
  }
}

// Use factory function to create HomePage with model dependency
export default (storyModel) => new HomePage(storyModel);
