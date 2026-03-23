import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

const PART_IMAGES = {
  'Bonnet': 'https://cdn.pixabay.com/photo/2016/03/14/15/41/volkswagen-1253653_1280.jpg',
  'Doors': 'https://cdn.pixabay.com/photo/2015/01/19/13/51/car-602808_1280.jpg',
  'Bumpers': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Head Lights': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'Side Mirrors': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Tail Lights': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Fenders': 'https://cdn.pixabay.com/photo/2015/09/17/17/34/subaru-946475_1280.jpg',
  'Grilles': 'https://cdn.pixabay.com/photo/2017/08/28/13/22/mercedes-2688738_1280.jpg',
  'default': 'https://cdn.pixabay.com/photo/2015/01/19/13/51/car-602808_1280.jpg',
};

const CAR_IMAGES = {
  'Mercedes- Benz  G - CLASS ': 'https://cdn.pixabay.com/photo/2017/08/28/13/22/mercedes-2688738_1280.jpg',
  'Mercedes- Benz  W108': 'https://cdn.pixabay.com/photo/2017/08/28/13/22/mercedes-2688738_1280.jpg',
  'BMW X1': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW i3 ': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW i5': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW i8': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW i4': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW i7': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW ix': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW X2': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW X3': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW X4': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW X5': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW X6': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW X7': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW M3 ': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW M5': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW M6': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW M8': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW Grand Touring ': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW 8 Series (Luxury Sports)': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'BMW BMW 1500,1600,1800,2000': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'Audi A1': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi A2': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi A4': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi A7': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi Q2': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi Q3': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi Q5': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi Q7': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi Q8': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi RS2 Avant': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi RS3': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi RS5': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi RS6': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi RS7': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Audi R8': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Toyota Tacoma': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Corolla ': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Camry': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Supra ': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Crown': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Venza ': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Highlander ': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Fortuner ': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Hilux': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Land Cruiser ': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Tundra ': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Rush': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Avensis ': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Yaris': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Belta ': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Passo': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Noah / Voxy': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Hiace ': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota RAV4': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Sienna ': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Prado': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Century': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Toyota Corolla Cross ': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Honda  Civic ': 'https://cdn.pixabay.com/photo/2016/09/02/09/29/honda-1637615_1280.jpg',
  'Honda  Accord ': 'https://cdn.pixabay.com/photo/2016/09/02/09/29/honda-1637615_1280.jpg',
  'Honda  City ': 'https://cdn.pixabay.com/photo/2016/09/02/09/29/honda-1637615_1280.jpg',
  'Honda  HR-V': 'https://cdn.pixabay.com/photo/2016/09/02/09/29/honda-1637615_1280.jpg',
  'Honda  Pilot': 'https://cdn.pixabay.com/photo/2016/09/02/09/29/honda-1637615_1280.jpg',
  'Nissan  Titan ': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Quest': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Murano ': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Qashqai': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Rogue': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Juke': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Kicks': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Versa ': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Sentra ': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Sunny ': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Note ': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Tiida ': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Almera ': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  maxima ': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Micra (March) ': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Armada': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Patrol': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  Navarra': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Nissan  primera': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Hyundai  Elantra ': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  Sonata ': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  Accent ': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  Getz': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  i10': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  i30': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  Santro': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  Creta': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  Tucson ': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  Santa Fe': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  Grandeur': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  Matrix ': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  Terracan ': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  Kona ': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  Venue ': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Hyundai  H-1': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Kia  Sportage ': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Kia  Sorenta': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Kia  Pregio': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Kia  Spectra': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Kia  Optima (k5)': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Kia  Picanto (Morning)': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Kia  Cerato (Forte)': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Kia  Carens ': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Kia  Rio ': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Kia  Pride ': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Kia  Carnival': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Kia  K8': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Kia  Soul': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Kia  K9': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Lexus LS400': 'https://cdn.pixabay.com/photo/2017/11/06/13/48/lexus-2923696_1280.jpg',
  'Lexus GS': 'https://cdn.pixabay.com/photo/2017/11/06/13/48/lexus-2923696_1280.jpg',
  'Lexus LX': 'https://cdn.pixabay.com/photo/2017/11/06/13/48/lexus-2923696_1280.jpg',
  'Lexus RX': 'https://cdn.pixabay.com/photo/2017/11/06/13/48/lexus-2923696_1280.jpg',
  'Lexus GX': 'https://cdn.pixabay.com/photo/2017/11/06/13/48/lexus-2923696_1280.jpg',
  'Lexus NX': 'https://cdn.pixabay.com/photo/2017/11/06/13/48/lexus-2923696_1280.jpg',
  'Lexus UX': 'https://cdn.pixabay.com/photo/2017/11/06/13/48/lexus-2923696_1280.jpg',
  'Lexus LC500': 'https://cdn.pixabay.com/photo/2017/11/06/13/48/lexus-2923696_1280.jpg',
  'Lexus RC': 'https://cdn.pixabay.com/photo/2017/11/06/13/48/lexus-2923696_1280.jpg',
  'Ford  Escort ': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Ford  Bronco': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Ford  F150': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Ford  F250': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Ford  F350': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Ford  Mustang ': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Ford  GT ': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Ford  Focus ': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Ford  Fiesta': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Ford  Fusion': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Ford  Edge ': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Ford  Escape ': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Land Rover  Discovery 1 ': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Land Rover  Discovery 2 ': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Land Rover  Discovery 3 ': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Land Rover  Discovery 4 ': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Land Rover  Discovery 5 ': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Land Rover  Discovery Sports ': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Land Rover  Range Rover Sports ': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Land Rover  Range Rover Evoque ': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Land Rover  Range Rover Velar ': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Land Rover  Defender ': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Porsche  911': 'https://cdn.pixabay.com/photo/2017/01/27/14/27/porsche-2113869_1280.jpg',
  'Porsche  Cayenne': 'https://cdn.pixabay.com/photo/2017/01/27/14/27/porsche-2113869_1280.jpg',
  'Porsche  Panamera ': 'https://cdn.pixabay.com/photo/2017/01/27/14/27/porsche-2113869_1280.jpg',
  'Porsche  GT3': 'https://cdn.pixabay.com/photo/2017/01/27/14/27/porsche-2113869_1280.jpg',
  'Dodge  Charger': 'https://cdn.pixabay.com/photo/2016/09/28/17/34/dodge-1698626_1280.jpg',
  'Dodge  Challenger ': 'https://cdn.pixabay.com/photo/2016/09/28/17/34/dodge-1698626_1280.jpg',
  'Dodge  Durango': 'https://cdn.pixabay.com/photo/2016/09/28/17/34/dodge-1698626_1280.jpg',
  'Dodge  Journey': 'https://cdn.pixabay.com/photo/2016/09/28/17/34/dodge-1698626_1280.jpg',
  'Dodge  RAM': 'https://cdn.pixabay.com/photo/2016/09/28/17/34/dodge-1698626_1280.jpg',
  'Jeeb  Wrangler': 'https://cdn.pixabay.com/photo/2016/05/06/22/25/jeep-1375209_1280.jpg',
  'Jeeb  Cherokee ': 'https://cdn.pixabay.com/photo/2016/05/06/22/25/jeep-1375209_1280.jpg',
  'Jeeb  Grand Cherokee': 'https://cdn.pixabay.com/photo/2016/05/06/22/25/jeep-1375209_1280.jpg',
  'Jeeb  Compass ': 'https://cdn.pixabay.com/photo/2016/05/06/22/25/jeep-1375209_1280.jpg',
  'Chevrolet  Spark': 'https://cdn.pixabay.com/photo/2016/02/26/17/00/chevrolet-1224353_1280.jpg',
  'Chevrolet  Malibu': 'https://cdn.pixabay.com/photo/2016/02/26/17/00/chevrolet-1224353_1280.jpg',
  'Chevrolet  Cruze ': 'https://cdn.pixabay.com/photo/2016/02/26/17/00/chevrolet-1224353_1280.jpg',
  'Chevrolet  Equinox': 'https://cdn.pixabay.com/photo/2016/02/26/17/00/chevrolet-1224353_1280.jpg',
  'Chevrolet  Camaro': 'https://cdn.pixabay.com/photo/2016/02/26/17/00/chevrolet-1224353_1280.jpg',
  'Chevrolet  corvette': 'https://cdn.pixabay.com/photo/2016/02/26/17/00/chevrolet-1224353_1280.jpg',
  'Chevrolet  Suburban ': 'https://cdn.pixabay.com/photo/2016/02/26/17/00/chevrolet-1224353_1280.jpg',
  'Chevrolet  Chevette': 'https://cdn.pixabay.com/photo/2016/02/26/17/00/chevrolet-1224353_1280.jpg',
  'Chevrolet  Aveo': 'https://cdn.pixabay.com/photo/2016/02/26/17/00/chevrolet-1224353_1280.jpg',
  'Madza  CX-5': 'https://cdn.pixabay.com/photo/2015/05/28/12/33/mazda-788747_1280.jpg',
  'Madza  CX-7 ': 'https://cdn.pixabay.com/photo/2015/05/28/12/33/mazda-788747_1280.jpg',
  'Madza  CX-3 ': 'https://cdn.pixabay.com/photo/2015/05/28/12/33/mazda-788747_1280.jpg',
  'Madza  CX-9 ': 'https://cdn.pixabay.com/photo/2015/05/28/12/33/mazda-788747_1280.jpg',
  'Suzuki S-Presso': 'https://cdn.pixabay.com/photo/2016/04/21/17/02/suzuki-1343849_1280.jpg',
  'default': 'https://cdn.pixabay.com/photo/2015/01/19/13/51/car-602808_1280.jpg',
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

async function updateAllProducts() {
  console.log('Starting comprehensive product image update...');
  console.log('Processing 2140 products in batches of 500\n');
  
  const batchSize = 500;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let batchNumber = 0;
  
  while (true) {
    batchNumber++;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`BATCH ${batchNumber} - Processing rows ${totalProcessed} to ${totalProcessed + batchSize}`);
    console.log(`${'='.repeat(60)}`);
    
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, brand_id, brands(name), model_id, models(name), category_id, categories(name)')
      .eq('is_deleted', false)
      .range(totalProcessed, totalProcessed + batchSize - 1);
    
    if (error) {
      console.error(`Error fetching batch ${batchNumber}:`, error.message);
      break;
    }
    
    if (!products || products.length === 0) {
      console.log('\nNo more products to process');
      break;
    }
    
    console.log(`Found ${products.length} products in this batch`);
    
    let batchUpdated = 0;
    let batchErrors = 0;
    
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
      
      if (updateError) {
        console.error(`Error updating product ${product.id}:`, updateError.message);
        batchErrors++;
      } else {
        batchUpdated++;
      }
      
      totalProcessed++;
    }
    
    totalUpdated += batchUpdated;
    
    console.log(`\nBatch ${batchNumber} Summary:`);
    console.log(`  Processed: ${products.length}`);
    console.log(`  Updated: ${batchUpdated}`);
    console.log(`  Errors: ${batchErrors}`);
    console.log(`  Total so far: ${totalProcessed}/${2140}`);
    
    if (products.length < batchSize) {
      console.log('\nAll products processed');
      break;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('FINAL SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total rows processed: ${totalProcessed}`);
  console.log(`Total successfully updated: ${totalUpdated}`);
  console.log(`Total errors: ${totalProcessed - totalUpdated}`);
  console.log(`${'='.repeat(60)}`);
  
  if (totalUpdated === 2140) {
    console.log('\n✓ SUCCESS: All 2140 products have been updated!');
  } else {
    console.log(`\n⚠ ${2140 - totalUpdated} products could not be updated`);
  }
}

updateAllProducts().catch(console.error);
