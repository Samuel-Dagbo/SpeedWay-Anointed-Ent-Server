import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

const PART_IMAGES = {
  'Bonnet': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280&q=80',
  'Doors': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Bumpers': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280&q=80',
  'Head Lights': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280&q=80',
  'Side Mirrors': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280&q=80',
  'Tail Lights': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280&q=80',
  'Fenders': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280&q=80',
  'Grilles': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280&q=80',
  'default': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280&q=80',
};

const CAR_IMAGES = {
  'Mercedes- Benz  G - CLASS ': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1280&q=80',
  'Mercedes- Benz  W108': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1280&q=80',
  'BMW X1': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW i3 ': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW i5': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW i8': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW i4': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW i7': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW ix': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW X2': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW X3': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW X4': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW X5': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW X6': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW X7': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW M3 ': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW M5': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW M6': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW M8': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW Grand Touring ': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW 8 Series (Luxury Sports)': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'BMW BMW 1500,1600,1800,2000': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1280&q=80',
  'Audi A1': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi A2': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi A4': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi A7': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi Q2': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi Q3': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi Q5': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi Q7': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi Q8': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi RS2 Avant': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi RS3': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi RS5': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi RS6': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi RS7': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Audi R8': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Toyota Tacoma': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Corolla ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Camry': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Supra ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Crown': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Venza ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Highlander ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Fortuner ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Hilux': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Land Cruiser ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Tundra ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Rush': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Avensis ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Yaris': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Belta ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Passo': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Noah / Voxy': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Hiace ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota RAV4': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Sienna ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Prado': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Century': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Toyota Corolla Cross ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Honda  Civic ': 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=1280&q=80',
  'Honda  Accord ': 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=1280&q=80',
  'Honda  City ': 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=1280&q=80',
  'Honda  HR-V': 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=1280&q=80',
  'Honda  Pilot': 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=1280&q=80',
  'Nissan  Titan ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Quest': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Murano ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Qashqai': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Rogue': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Juke': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Kicks': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Versa ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Sentra ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Sunny ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Note ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Tiida ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Almera ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  maxima ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Micra (March) ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Armada': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Patrol': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  Navarra': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Nissan  primera': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Hyundai  Elantra ': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  Sonata ': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  Accent ': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  Getz': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  i10': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  i30': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  Santro': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  Creta': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  Tucson ': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  Santa Fe': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  Grandeur': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  Matrix ': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  Terracan ': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  Kona ': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  Venue ': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Hyundai  H-1': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Kia  Sportage ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Kia  Sorenta': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Kia  Pregio': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Kia  Spectra': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Kia  Optima (k5)': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Kia  Picanto (Morning)': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Kia  Cerato (Forte)': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Kia  Carens ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Kia  Rio ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Kia  Pride ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Kia  Carnival': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Kia  K8': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Kia  Soul': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Kia  K9': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Lexus LS400': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Lexus GS': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Lexus LX': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Lexus RX': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Lexus GX': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Lexus NX': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Lexus UX': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Lexus LC500': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Lexus RC': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Ford  Escort ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Ford  Bronco': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Ford  F150': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Ford  F250': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Ford  F350': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Ford  Mustang ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Ford  GT ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Ford  Focus ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Ford  Fiesta': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Ford  Fusion': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Ford  Edge ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Ford  Escape ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Land Rover  Discovery 1 ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Land Rover  Discovery 2 ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Land Rover  Discovery 3 ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Land Rover  Discovery 4 ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Land Rover  Discovery 5 ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Land Rover  Discovery Sports ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Land Rover  Range Rover Sports ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Land Rover  Range Rover Evoque ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Land Rover  Range Rover Velar ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Land Rover  Defender ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Porsche  911': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Porsche  Cayenne': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Porsche  Panamera ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Porsche  GT3': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Dodge  Charger': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Dodge  Challenger ': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Dodge  Durango': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Dodge  Journey': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Dodge  RAM': 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&w=1280',
  'Jeeb  Wrangler': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1280&q=80',
  'Jeeb  Cherokee ': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1280&q=80',
  'Jeeb  Grand Cherokee': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1280&q=80',
  'Jeeb  Compass ': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1280&q=80',
  'Chevrolet  Spark': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Chevrolet  Malibu': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Chevrolet  Cruze ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Chevrolet  Equinox': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Chevrolet  Camaro': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Chevrolet  corvette': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Chevrolet  Suburban ': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Chevrolet  Chevette': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Chevrolet  Aveo': 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&w=1280',
  'Madza  CX-5': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Madza  CX-7 ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Madza  CX-3 ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Madza  CX-9 ': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'Suzuki S-Presso': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&w=1280',
  'default': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1280&q=80',
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

async function updateWithMultiSourceImages() {
  console.log('Updating 2140 products with REAL images from Multiple Sources (Unsplash, Pexels)...\n');
  
  const batchSize = 500;
  let offset = 1500;
  let totalUpdated = 0;
  let batchNumber = 3;
  
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
  console.log('UPDATE COMPLETE - Multi-Source Images');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total updated: ${totalUpdated}`);
  console.log('\nImages now use REAL URLs from:');
  console.log('  - Unsplash (images.unsplash.com)');
  console.log('  - Pexels (images.pexels.com)');
}

updateWithMultiSourceImages().catch(console.error);
