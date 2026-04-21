import React from 'react'
import Banner from './Banner'
import Categories from './Categories'
import ClothesSection from './ClothesSection'
import TrendingPrds from '../Shop/TrendingPrds'
import DealsSection from './DealsSection'
import PromoSection from './PromoSection'
import Blogs from '../Blog/Blogs'

const Home = () => {
  return (
    <>
    <Banner/>
    <Categories/>
    <ClothesSection/>
    <TrendingPrds/>
    <DealsSection/>
    <PromoSection/>
    <Blogs/>
    </>
  )
}

export default Home