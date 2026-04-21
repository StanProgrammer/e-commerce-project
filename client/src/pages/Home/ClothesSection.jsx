import React from 'react'
import outwear from '../../assets/outwear.png'
import casual from '../../assets/casual.png'
import formal from '../../assets/formal.png'
const cards = [
    {
        id: 1,
        image: outwear,
        trend: '2025 Trends',
        title: "Outerwear",
    },
    {
        id: 2,
        image: casual,
        trend: '2025 Trends',
        title:"Casual Wear",
    },
    {
        id: 3,
        image: formal,
        trend: '2025 Trends',
        title: "Formal Wear",
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
                        <a href="#">Shop Now</a>
                    </div>
                   
                </div>
            ))
        }
    </section>
  )
}

export default ClothesSection