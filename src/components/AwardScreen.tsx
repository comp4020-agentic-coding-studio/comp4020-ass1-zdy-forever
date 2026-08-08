export type AwardScreenProps = {
  onReviewChallenges: () => void;
  onReviewTutorials: () => void;
};

export function AwardScreen({ onReviewChallenges, onReviewTutorials }: AwardScreenProps) {
  return (
    <section className="award-screen" aria-labelledby="award-heading">
      <div className="award-screen__content">
        <p className="tutorial__eyebrow">Exposure Lab complete</p>
        <div className="award-screen__mark" aria-hidden="true">✓</div>
        <h2 id="award-heading">Congratulations — you can balance the exposure triangle</h2>
        <p className="award-screen__lead">
          You completed every lesson and challenge while protecting exposure, focus, motion and image quality.
        </p>

        <div className="award-card" aria-label="Exposure Lab award">
          <span>Exposure Lab Award</span>
          <strong>Manual Exposure Foundations</strong>
          <p>ISO · Aperture · Shutter speed</p>
        </div>

        <div className="award-screen__actions">
          <button className="award-screen__primary" type="button" onClick={onReviewChallenges}>Review challenges</button>
          <button type="button" onClick={onReviewTutorials}>Review tutorials</button>
        </div>
      </div>
    </section>
  );
}
