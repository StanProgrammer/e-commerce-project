import React from 'react'
import { Link } from 'react-router-dom'
import bannerImage from '../../assets/header.webp'
const Banner = () => {
  return (
    <div className='section__container header__container'>
        <div className='header__content z-30'>
          <h4 className='uppercase'>UpTo 10% Discount On</h4>
          <h1>Women's Fashion</h1>
          <p>Discover the latest trends and express your unique style with our Women's Fashion website
            Explore curated collections, from chic apparel to must-have accessories, all designed to empower and inspire your wardrobe choices.
          </p>
          <button className='btn'><Link to='/shop'>Explore Now</Link></button>
        </div>
        <div className='header__image'>
          <img src={bannerImage} alt='banner-img' className='header__img z-10'/>
        </div>
    </div>
  )
}

export default Banner