function AboutPage() {
  const features = [
    {
      title: "AI-Powered Extraction",
      description: "Convert meeting transcripts and recordings into clear, actionable tasks using advanced AI technology."
    },
    {
      title: "Structured Task Creation",
      description: "Automatically extract task owners, deadlines, and priorities from your meeting content."
    },
    {
      title: "Multiple Input Formats",
      description: "Process text notes, audio files, or video recordings with flexible input options."
    },
    {
      title: "Easy Review & Export",
      description: "Review extracted tasks, make edits, and export results in practical formats for your workflow."
    },
    {
      title: "Team Collaboration",
      description: "Help teams reduce manual note processing and improve follow-through on action items."
    },
    {
      title: "Actionable Insights",
      description: "Turn unstructured meeting data into organized, actionable intelligence for better productivity."
    }
  ];

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
      </div>

      <div className="feature-cards">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <h3 style={{
              fontSize: "1.2rem",
              fontWeight: "700",
              color: "var(--text-primary)",
              marginBottom: "12px"
            }}>
              {feature.title}
            </h3>
            <p style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              lineHeight: "1.6",
              margin: "0"
            }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AboutPage;