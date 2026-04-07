function AboutPage() {
  return (
    <section className="about-page" aria-label="About Meet to Action">
      <div className="about-card">
        <h2 className="about-page-title">About Us</h2>
        <p className="about-page-text">
          Meet to Action is an AI-powered system that converts meeting transcripts and
          recordings into clear, actionable tasks.
        </p>
        <p className="about-page-text">
          Our goal is to help teams reduce manual note processing and improve follow-through by
          extracting task owners, deadlines, and structured action items.
        </p>
        <p className="about-page-text">
          You can process text notes or audio files, review extracted tasks, and export results
          in practical formats for your workflow.
        </p>
      </div>
    </section>
  );
}

export default AboutPage;