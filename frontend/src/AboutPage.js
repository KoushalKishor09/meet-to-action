function AboutPage() {
  const teamMembers = [
    {
      name: "Koushal Kishor",
      role: "Project Lead",
      linkedin: "",
      email: "",
      github: "https://github.com/KoushalKishor09"
    },
    {
      name: "Team Member 2",
      role: "Frontend Developer",
      linkedin: "",
      email: "",
      github: ""
    },
    {
      name: "Team Member 3",
      role: "Backend Developer",
      linkedin: "",
      email: "",
      github: ""
    },
    {
      name: "Team Member 4",
      role: "AI/ML Engineer",
      linkedin: "",
      email: "",
      github: ""
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
        <p className="about-page-text">
          You can process text notes or audio files, review extracted tasks, and export results
          in practical formats for your workflow.
        </p>
      </div>

      <section className="team-section" aria-label="Team contributors">
        <div className="team-section-head">
          <h3 className="about-page-title team-section-title">Team Contributors</h3>
          <p className="about-page-text team-section-subtitle">
            The people who built and contributed to making this website strong.
          </p>
        </div>

        <div className="team-grid">
          {teamMembers.map((member) => (
            <article className="team-member-card" key={member.name}>
              <div className="team-member-avatar" aria-hidden="true">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="team-member-name">{member.name}</h4>
              <p className="team-member-role">{member.role}</p>

              <div className="team-member-links">
                {member.linkedin && (
                  <a className="team-member-link" href={member.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                )}
                {member.email && (
                  <a className="team-member-link" href={`mailto:${member.email}`}>
                    Email
                  </a>
                )}
                {member.github && (
                  <a className="team-member-link" href={member.github} target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                )}
                {!member.linkedin && !member.email && !member.github && (
                  <span className="team-member-placeholder">Profile links will be added soon.</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default AboutPage;