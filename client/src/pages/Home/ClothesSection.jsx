import React from 'react'
import { Link } from 'react-router-dom'
import outwear from '../../assets/outwear.png'
import casual from '../../assets/casual.png'
import formal from '../../assets/formal.png'
const cards = [
    {
        id: 1,
        image: outwear,
        trend: '2025 Trends',
        title: "Outerwear",
        path: "/shop?category=clothes",
    },
    {
        id: 2,
        image: casual,
        trend: '2025 Trends',
        title:"Casual Wear",
        path: "/shop?category=clothes",
    },
    {
        id: 3,
        image: formal,
        trend: '2025 Trends',
        title: "Formal Wear",
        path: "/shop?category=clothes",
    },
]
const ClothesSection = () => {
  return (
    <section className='section__container hero__container'>
        {
            cards.map((card) => (
                <div key={card.id} className='hero__card'>
                    <img src={card.image} alt=""/>
                    <div className='hero__content'>
                        <p>{card.trend}</p>
                        <h4>{card.title}</h4>
                        <Link to={card.path}>Shop Now</Link>
                    </div>
                   
                </div>
            ))
        }
    </section>
  )
}

export default ClothesSection
