import { useEffect, useState, useRef } from "react";
import dealsImg from "../../assets/deals.webp";
const DealsSection = () => {
  const getNextMonthStart = (now = new Date()) => {
    return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  };

  const msToParts = (ms) => {
    if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);

    return { days, hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(() => {
    const now = new Date();
    const target = getNextMonthStart(now);
    return msToParts(target.getTime() - now.getTime());
  });

  const targetRef = useRef(getNextMonthStart());

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      let delta = targetRef.current.getTime() - now.getTime();

      if (delta <= 0) {
        targetRef.current = getNextMonthStart(now);
        delta = targetRef.current.getTime() - now.getTime();
      }

      setTimeLeft(msToParts(delta));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="section__container deals__container">
      <div className="deals__image">
        <img src={dealsImg} alt="" />
      </div>
      <div className="deals__content">
        <h5>Get Up To 20% Discount</h5>
        <h4>Deals Of This Month</h4>
        <p>
          Our Women's Fashion Deals of the Month are here to make your shopping experience even better. Grab
          limited-time offers on our best-selling styles, from trendy dresses to everyday essentials. Refresh your
          wardrobe and save big while the deals last.
        </p>
        <div className="deals__countdown flex-wrap">
          <div className="deals__countdown__card">
            <h4>{timeLeft.days}</h4>
            <p>Days</p>
          </div>

          <div className="deals__countdown__card">
            <h4>{timeLeft.hours}</h4>
            <p>hrs</p>
          </div>

          <div className="deals__countdown__card">
            <h4>{timeLeft.minutes}</h4>
            <p>mins</p>
          </div>

          <div className="deals__countdown__card">
            <h4>{timeLeft.seconds}</h4>
            <p>sec</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DealsSection;
