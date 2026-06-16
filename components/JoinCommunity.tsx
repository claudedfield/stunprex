/**
 * JoinCommunity — replaces the deprecated NewsletterCapture section on the home page.
 * Same design rhythm (mint background, centred), different message + CTA.
 * D8e: "members" identity language, no paid tier, no newsletter, no Skool reference.
 */
export function JoinCommunity() {
  return (
    <section className="py-20 md:py-24 bg-mint">
      <div className="container-site">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Community
          </p>
          <h2 className="font-heading">
            Real questions. Honest answers. Long horizon.
          </h2>
          <p className="mt-5 text-brown/80 text-lg leading-relaxed">
            Free membership. Ask a question, post an answer, compare to last week.
            Methodology-grounded, no engagement-bait. The kind of football community we want to exist.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/community" className="btn-primary">
              Join the community
            </a>
            <a
              href="/community"
              className="font-ui uppercase tracking-wider text-sm text-deepblue hover:text-orange self-center transition-colors"
            >
              Browse first →
            </a>
          </div>
          <p className="mt-3 text-xs text-brown/60 italic">
            No paid tier. No newsletter spam. Just the conversation.
          </p>
        </div>
      </div>
    </section>
  );
}
