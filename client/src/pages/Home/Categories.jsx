import React from 'react'
import Accessories from '../../assets/accessories.jpg'
import Clothes from '../../assets/clothes.jpg'
import Jewellery from '../../assets/jewellery.jpg'
import Cosmetics from '../../assets/cosmetics.jpg'
import { Link } from 'react-router-dom'
const Categories = () => {
    const categories = [
        {name: "Accessories", path:"/accessories", img:Accessories},
        {name: "Clothes Collection", path:"/clothes", img:Clothes},
        {name: "Jewellery", path:"/jewellery", img:Jewellery},
        {name: "Cosmetics", path:"/cosmetics", img:Cosmetics},
    ]
  return (
    <>
    <div className='product__grid'>
      {
        categories.map((category,index) => (
            
                <Link key={index} to={`/category${category.path}`} className='categories__card'>
                    <img src={category.img} alt={category.name} />
                    <h4>{category.name}</h4>
                </Link>
           
        ))
      }
    </div>
    </>
  )
}

export default Categories