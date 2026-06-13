export type MenuItem = {
  name: string;
  description?: string;
  price: string;
  badge?: "chef" | "veg";
  /** false when marked unavailable in the dashboard */
  available?: boolean;
};

export type MenuSection = {
  id: string;
  number: string;
  title: string;
  subtitle?: string;
  items: MenuItem[];
};

export const menu: MenuSection[] = [
  {
    id: "pizzas",
    number: "01",
    title: "Pizzas",
    subtitle: "12 inch · fresh dough · premium toppings",
    items: [
      { name: "Margherita", description: "Nap sauce, cheese, basil leaves, olive oil, tomato", price: "20.00", badge: "veg" },
      { name: "Veggie Supreme", description: "Nap sauce, cheese, capsicum, onion, olives, mushroom, corn or pineapple", price: "22.00", badge: "veg" },
      { name: "Paneer Tikka", description: "Tikka sauce, cheese, paneer, onion, capsicum, coriander", price: "22.00", badge: "veg" },
      { name: "BBQ Chicken", description: "BBQ sauce, cheese, onion, marinated chicken", price: "24.00" },
      { name: "Peri Peri Chicken", description: "Peri chicken, cheese, onion, capsicum", price: "24.00" },
      { name: "Beef Pepperoni", description: "Nap sauce, cheese, beef pepperoni", price: "26.00" },
      { name: "Beef Supreme", description: "Nap sauce, cheese, beef pepperoni, onion, olives, minced beef", price: "26.00", badge: "chef" },
      { name: "Butter Chicken", description: "Butter chicken sauce, cheese, onion, chicken, tomato, goat cheese", price: "24.00", badge: "chef" },
    ],
  },
  {
    id: "kebabs",
    number: "02",
    title: "Kebabs",
    items: [
      { name: "Zinger Chicken Kebab", price: "14.99" },
      { name: "Chicken Kebab", price: "16.00" },
      { name: "Doner Kebab", price: "18.00" },
      { name: "Mixed Kebab", price: "19.00", badge: "chef" },
    ],
  },
  {
    id: "gozleme",
    number: "03",
    title: "Gozleme",
    items: [
      { name: "Chicken Gozleme", price: "19.00" },
      { name: "Doner Gozleme", price: "20.00" },
    ],
  },
  {
    id: "burgers",
    number: "04",
    title: "Burgers & Tacos",
    items: [
      { name: "Smashed Chicken Burger", price: "18.00" },
      { name: "Smashed Beef Burger", price: "24.00", badge: "chef" },
      { name: "Chicken Taco", price: "15.00" },
      { name: "Beef Taco", price: "17.00" },
      { name: "Veggie Taco", price: "12.00", badge: "veg" },
    ],
  },
  {
    id: "salads",
    number: "05",
    title: "Salads",
    items: [
      { name: "Mediterranean Salad", price: "8.00", badge: "veg" },
      { name: "Chicken Avocado Salad", price: "13.00" },
      { name: "Greek Salad", price: "6.00", badge: "veg" },
      { name: "Chicken Caesar Salad", price: "14.00" },
      { name: "Coleslaw", price: "3.00", badge: "veg" },
      { name: "Egg Salad", price: "6.00", badge: "veg" },
    ],
  },
  {
    id: "fries",
    number: "06",
    title: "Fries",
    items: [
      { name: "Peri Peri Fries — Small", price: "8.00" },
      { name: "Peri Peri Fries — Large", price: "10.00" },
      { name: "Chicken Loaded Fries", price: "16.99" },
      { name: "Cheese Loaded Fries", price: "12.99", badge: "veg" },
    ],
  },
  {
    id: "kids",
    number: "07",
    title: "Kids Menu",
    items: [
      { name: "Kids Pizza", price: "10.00" },
      { name: "Kids Nuggets & Chips", price: "10.00" },
    ],
  },
  {
    id: "drinks",
    number: "08",
    title: "Drinks",
    items: [
      { name: "Water", price: "2.99" },
      { name: "Soft Drink Can", price: "4.00" },
      { name: "Soft Drink 600ml", price: "5.50" },
    ],
  },
  {
    id: "desserts",
    number: "09",
    title: "Desserts",
    items: [
      { name: "Hot Brownie with Ice-Cream", price: "8.00" },
      { name: "Baklava", description: "per piece", price: "2.00" },
    ],
  },
  {
    id: "combos",
    number: "10",
    title: "Combos",
    items: [
      { name: "Large Fries + 600ml Soft Drink", price: "10.00" },
      { name: "Small Fries + Soft Drink Can", price: "8.00" },
    ],
  },
  {
    id: "extras",
    number: "11",
    title: "Extras",
    items: [
      { name: "Double Meat", price: "4.00" },
      { name: "Extra Cheese", price: "2.00" },
      { name: "Egg", price: "2.00" },
      { name: "Extra Add On", price: "3.00" },
    ],
  },
];

export type Sauce = {
  name: string;
  // Price as a string for display parity with MenuItem. "0.00" means free.
  price: string;
  /** false when marked unavailable in the dashboard */
  available?: boolean;
};

export const sauces: Sauce[] = [
  { name: "Sour Cream", price: "0.00" },
  { name: "Sweet Chilli", price: "0.00" },
  { name: "Hot Chilli", price: "0.00" },
  { name: "Garlic", price: "0.00" },
  { name: "BBQ", price: "0.00" },
  { name: "Satay", price: "0.00" },
  { name: "Tomato", price: "0.00" },
  { name: "Hummus", price: "0.00" },
];

export const restaurant = {
  name: "Food Fort",
  tagline: "Hunger Ends Here",
  phone: "08 9921 5295",
  phoneHref: "tel:+61899215295",
  email: "Ask@foodfort.com.au",
  address: "Shop 6/429 Chapman Rd, Bluff Point WA 6530",
  mapsUrl: "https://maps.app.goo.gl/hYQpzNRURFxgAbGc7",
  mapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3401.5!2d114.6242822!3d-28.7372796!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2bda45a9a38f2a9f%3A0x2666992646db481b!2sFOOD%20FORT!5e0!3m2!1sen!2sau!4v1749456000000!5m2!1sen!2sau",
  hours: [
    { day: "Monday", time: "Closed" },
    { day: "Tuesday", time: "15:00 — 21:00" },
    { day: "Wed – Sun", time: "11:00 — 21:00" },
  ],
};
