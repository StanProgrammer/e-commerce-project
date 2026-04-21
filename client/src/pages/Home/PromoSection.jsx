import React from 'react'

const PromoSection = () => {
  return (
    <section className='section__container banner__container'>
        <div className='banner__card'>
            <span><i className="ri-truck-line"></i></span>
            <h4>Free Shipping</h4>
            <p>On all orders over $50, anywhere in the Country.</p>
        </div>
          <div className='banner__card'>
            <span><i className="ri-money-rupee-circle-line"></i></span>
            <h4>Money Back Guarantee</h4>
            <p>Not satisfied with the product? Get a full refund within 30 days.</p>
        </div>
          <div className='banner__card'>
            <span><i className="ri-user-voice-line"></i></span>
            <h4>24/7 Customer Support</h4>
            <p>Our support team is here to help you anytime, anywhere.</p>
        </div>
    </section>
  )
}

export default PromoSection