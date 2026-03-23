import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

const PART_IMAGES = {
  'Bonnet': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
  'Doors': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
  'Bumpers': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
  'Head Lights': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
  'Side Mirrors': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
  'Tail Lights': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
  'Fenders': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
  'Grilles': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
  'default': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
};

const CAR_IMAGES = {
  'Mercedes- Benz  G - CLASS ': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1280',
  'Mercedes- Benz  W108': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1280',
  'BMW X1': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW i3 ': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW i5': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW i8': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW i4': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW i7': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW ix': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW X2': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW X3': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW X4': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW X5': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW X6': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW X7': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW M3 ': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW M5': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW M6': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW M8': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW Grand Touring ': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW 8 Series (Luxury Sports)': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'BMW BMW 1500,1600,1800,2000': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'Audi A1': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi A2': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi A4': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi A7': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi Q2': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi Q3': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi Q5': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi Q7': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi Q8': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi RS2 Avant': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi RS3': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi RS5': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi RS6': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi RS7': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Audi R8': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1280',
  'Toyota Tacoma': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Corolla ': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Camry': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Supra ': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Crown': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Venza ': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Highlander ': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Fortuner ': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Hilux': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Land Cruiser ': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Tundra ': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Rush': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Avensis ': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Yaris': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Belta ': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Passo': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Noah / Voxy': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Hiace ': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota RAV4': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Sienna ': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Prado': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Century': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Toyota Corolla Cross ': 'https://images.unsplash.com/photo-1626668011687-8a114cf5a34c?w=1280',
  'Honda  Civic ': 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=1280',
  'Honda  Accord ': 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=1280',
  'Honda  City ': 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=1280',
  'Honda  HR-V': 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=1280',
  'Honda  Pilot': 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=1280',
  'Nissan  Titan ': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Quest': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Murano ': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Qashqai': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Rogue': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Juke': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Kicks': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Versa ': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Sentra ': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Sunny ': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Note ': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Tiida ': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Almera ': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  maxima ': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Micra (March) ': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Armada': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Patrol': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  Navarra': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Nissan  primera': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Hyundai  Elantra ': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  Sonata ': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  Accent ': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  Getz': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  i10': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  i30': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  Santro': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  Creta': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  Tucson ': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  Santa Fe': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  Grandeur': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  Matrix ': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  Terracan ': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  Kona ': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  Venue ': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Hyundai  H-1': 'https://images.unsplash.com/photo-1669633928709-f8d74e7364c1?w=1280',
  'Kia  Sportage ': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Kia  Sorenta': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Kia  Pregio': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Kia  Spectra': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Kia  Optima (k5)': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Kia  Picanto (Morning)': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Kia  Cerato (Forte)': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Kia  Carens ': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Kia  Rio ': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Kia  Pride ': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Kia  Carnival': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Kia  K8': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Kia  Soul': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Kia  K9': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'Lexus LS400': 'https://images.unsplash.com/photo-1544636331-e26879cd3d3b?w=1280',
  'Lexus GS': 'https://images.unsplash.com/photo-1544636331-e26879cd3d3b?w=1280',
  'Lexus LX': 'https://images.unsplash.com/photo-1544636331-e26879cd3d3b?w=1280',
  'Lexus RX': 'https://images.unsplash.com/photo-1544636331-e26879cd3d3b?w=1280',
  'Lexus GX': 'https://images.unsplash.com/photo-1544636331-e26879cd3d3b?w=1280',
  'Lexus NX': 'https://images.unsplash.com/photo-1544636331-e26879cd3d3b?w=1280',
  'Lexus UX': 'https://images.unsplash.com/photo-1544636331-e26879cd3d3b?w=1280',
  'Lexus LC500': 'https://images.unsplash.com/photo-1544636331-e26879cd3d3b?w=1280',
  'Lexus RC': 'https://images.unsplash.com/photo-1544636331-e26879cd3d3b?w=1280',
  'Ford  Escort ': 'https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=1280',
  'Ford  Bronco': 'https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=1280',
  'Ford  F150': 'https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=1280',
  'Ford  F250': 'https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=1280',
  'Ford  F350': 'https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=1280',
  'Ford  Mustang ': 'https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=1280',
  'Ford  GT ': 'https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=1280',
  'Ford  Focus ': 'https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=1280',
  'Ford  Fiesta': 'https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=1280',
  'Ford  Fusion': 'https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=1280',
  'Ford  Edge ': 'https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=1280',
  'Ford  Escape ': 'https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=1280',
  'Land Rover  Discovery 1 ': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1280',
  'Land Rover  Discovery 2 ': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1280',
  'Land Rover  Discovery 3 ': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1280',
  'Land Rover  Discovery 4 ': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1280',
  'Land Rover  Discovery 5 ': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1280',
  'Land Rover  Discovery Sports ': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1280',
  'Land Rover  Range Rover Sports ': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1280',
  'Land Rover  Range Rover Evoque ': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1280',
  'Land Rover  Range Rover Velar ': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1280',
  'Land Rover  Defender ': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1280',
  'Porsche  911': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
  'Porsche  Cayenne': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
  'Porsche  Panamera ': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
  'Porsche  GT3': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
  'Dodge  Charger': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Dodge  Challenger ': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Dodge  Durango': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Dodge  Journey': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Dodge  RAM': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Jeeb  Wrangler': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1280',
  'Jeeb  Cherokee ': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1280',
  'Jeeb  Grand Cherokee': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1280',
  'Jeeb  Compass ': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1280',
  'Chevrolet  Spark': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Chevrolet  Malibu': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Chevrolet  Cruze ': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Chevrolet  Equinox': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Chevrolet  Camaro': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Chevrolet  corvette': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Chevrolet  Suburban ': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Chevrolet  Chevette': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Chevrolet  Aveo': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280',
  'Madza  CX-5': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'Madza  CX-7 ': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'Madza  CX-3 ': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'Madza  CX-9 ': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280',
  'Suzuki S-Presso': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280',
  'default': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280',
};

function getPartImage(categoryName) {
  const name = (categoryName || '').trim().toLowerCase();
  
  if (name.includes('bonnet')) return PART_IMAGES['Bonnet'];
  if (name.includes('door')) return PART_IMAGES['Doors'];
  if (name.includes('bumper')) return PART_IMAGES['Bumpers'];
  if (name.includes('head light') || name.includes('headlight')) return PART_IMAGES['Head Lights'];
  if (name.includes('side mirror') || name.includes('mirror')) return PART_IMAGES['Side Mirrors'];
  if (name.includes('tail light') || name.includes('taillight')) return PART_IMAGES['Tail Lights'];
  if (name.includes('fender')) return PART_IMAGES['Fenders'];
  if (name.includes('grille') || name.includes('grill')) return PART_IMAGES['Grilles'];
  if (name.includes('gear')) return PART_IMAGES['default'];
  
  return PART_IMAGES['default'];
}

function getCarImage(brandName, modelName) {
  const key = (brandName || '') + ' ' + (modelName || '');
  return CAR_IMAGES[key] || CAR_IMAGES['default'];
}

async function updateWithRealImages() {
  console.log('Updating 2140 products with REAL working Unsplash images...\n');
  
  const batchSize = 500;
  let offset = 0;
  let totalUpdated = 0;
  let batchNumber = 0;
  
  while (offset < 2140) {
    batchNumber++;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`BATCH ${batchNumber} - Processing rows ${offset} to ${offset + batchSize}`);
    console.log(`${'='.repeat(60)}`);
    
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, brand_id, brands(name), model_id, models(name), category_id, categories(name)')
      .eq('is_deleted', false)
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      console.error(`Error fetching batch ${batchNumber}:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue;
    }
    
    if (!products || products.length === 0) break;
    
    let batchUpdated = 0;
    
    for (const product of products) {
      const brandName = product.brands?.name || '';
      const modelName = product.models?.name || '';
      const categoryName = product.categories?.name || '';
      
      const image_url = getPartImage(categoryName);
      const car_image_url = getCarImage(brandName, modelName);
      
      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({ image_url, car_image_url })
        .eq('id', product.id);
      
      if (!updateError) {
        batchUpdated++;
      }
    }
    
    totalUpdated += batchUpdated;
    console.log(`Batch ${batchNumber}: Updated ${batchUpdated}/${products.length}`);
    console.log(`Total progress: ${offset + products.length}/2140`);
    
    offset += batchSize;
    if (products.length < batchSize) break;
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('UPDATE COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total updated: ${totalUpdated}`);
  console.log('\nAll images now use REAL Unsplash URLs!');
}

updateWithRealImages().catch(console.error);
