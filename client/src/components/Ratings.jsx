import React from 'react'

const   Ratings = ({rating}) => {
    const stars = []
    for(let i=1; i<=5; i++){
        if(rating >= i){
            stars.push(<i key={i} className="ri-star-fill"></i>)
        } else if(rating >= i - 0.5){
            stars.push(<i key={i} className="ri-star-half-fill"></i>)
        } else {
            stars.push(<i key={i} className="ri-star-line"></i>)
        }
    }
  return (
    <div className='product__rating'>{stars}</div>
  )
}

export default Ratings