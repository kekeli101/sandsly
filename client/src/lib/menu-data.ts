// Style reminder: keep content punchy, high-contrast, and grounded in the supplied dark street-food reference.

export type MenuCategory = "boba" | "yogurt" | "ice-cream" | "pizza" | "fries" | "pork";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: MenuCategory;
  badge?: string;
  crunch: number;
};

export const menuItems: MenuItem[] = [
  {
    id: "matcha-cloud-boba",
    name: "Matcha Cloud Boba",
    description: "Ceremonial matcha, brown sugar pearls, and a savory cheese cloud foam.",
    price: 75,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAToXdghCpHEt6Iqomv0rjpXB_iBHWVSReD5ScUnPNZPRo3xV2ftA6AraKr5btDpTAIKLgfGBBHpZGs0dUAZ02eAOmhPYZ-nzERM8QEi7NWGoLl5Db1aKln_PNAmYo8kupJFr4N7o3kcMFAUSZirL3YSBCSZzkITC4N1qBRWTjiIRdhaKTz1Xm5ZRul-lf8TuETwfFI6JCLu0x9Ccu3_u5lymZHjXhYaAmI16vU4EErLYqWCZ3gJny2",
    category: "boba",
    badge: "New",
    crunch: 1,
  },
  {
    id: "tiger-sugar-boba",
    name: "Tiger Sugar Crunch Boba",
    description: "Brown sugar pearls, cold brew tea, and a toasted caramel cream cap.",
    price: 65,
    image: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=85",
    category: "boba",
    crunch: 2,
  },
  {
    id: "mango-crunch-yogurt",
    name: "Mango Crunch Yogurt",
    description: "Creamy Greek-style yogurt, bright mango, toasted granola, and a honey finish.",
    price: 55,
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85",
    category: "yogurt",
    badge: "Fresh",
    crunch: 3,
  },
  {
    id: "black-sesame-ice-cream",
    name: "Black Sesame Ice Cream",
    description: "Silky black sesame ice cream with caramel crunch and roasted peanut dust.",
    price: 45,
    image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=900&q=85",
    category: "ice-cream",
    badge: "Cold drop",
    crunch: 2,
  },
  {
    id: "spicy-honey-pepperoni",
    name: "Spicy Honey Pepperoni",
    description: "Thick crust, charred cups, and our signature hot honey drizzle.",
    price: 140,
    image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1400&q=85",
    category: "pizza",
    badge: "Hot",
    crunch: 3,
  },
  {
    id: "neon-fries",
    name: "Neon Fries",
    description: "Crinkle cut fries drenched in liquid gold cheddar, candied bacon dust, and scallions.",
    price: 80,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBD1g8cR6ue6JCeBkt6u9ODvJsS-FICRFkLycvoNUPZFUv4SGzHgUVQgLTwQK8eXHHz6zS3Apnrwi4Gm8key5WUb0KlvSCIkrriI_24iNlQVgWCCGuOiy9oIY8RPwyDWN0evy5Lfe7uHxiJGLGNbqSQyNmKi00vaqkGYDa_8QeB0OuuWBRHH1LojnvOkKoWaic5wM4Opxf_Xs2lqXsoe0Wor4BrD44-HtT5C8Bzrf-B5U7ZO8CY4I_S",
    category: "fries",
    badge: "New",
    crunch: 4,
  },
  {
    id: "crunchy-garlic-pork",
    name: "Crunchy Garlic Pork",
    description: "Twice-fried pork belly tossed in sticky garlic soy glaze and chili flakes.",
    price: 120,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_72Dmatc8j1YIhJh-UIrX3bRp8O7J94Jig4st1SSYVNQXZk09vOgOVnBpz0Jk1QIv3gBw6rJnJv4Voe6iYuG7mNFCFUqKYhL0_7jhy54KS8Ww7sSOEFkDZdIOqJRHyiSAnGEQJuokxbRZN5U1L5AsLoZ-BaxAIVFig85vPGbdoDHz29S3sWSRPPD4WktksuEJJ181RxGTxlaZFlAKxKN5IDBPAbJNqIwGCjMOH5fZ6dxT3EjF7R9d",
    category: "pork",
    crunch: 5,
  },
];

export const categoryLabels: Record<MenuCategory, string> = {
  boba: "Boba",
  yogurt: "Yogurt",
  "ice-cream": "Ice cream",
  pizza: "Pizza",
  fries: "Fries",
  pork: "Pork",
};

export const formatPrice = (price: number) => `GH₵ ${price.toFixed(2)}`;
