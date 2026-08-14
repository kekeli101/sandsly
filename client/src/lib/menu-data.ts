// Style reminder: keep content punchy, high-contrast, and grounded in the supplied dark street-food reference.

export type MenuCategory = "savory" | "boba" | "sides";

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
    id: "street-brawler",
    name: "The Street Brawler",
    description: "Double-fried crispy thigh, ghost pepper slaw, black garlic mayo on a toasted brioche bun.",
    price: 12,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuAj_o5cKQ58LPBYEM03X9mdxgr3sf4hh0725r0zBS5QytXHXQhuZ0Ve9i-ExGKjuHYmAk2ybSlvJ34YkjXXw5y2L7QoyzGJ3oO8nOunlqxMsuGXF3lvMslIo3YdqECQuyIoy74o9XoKAwfAF7NBaEOByUevbEw7NOs9AkstbPViqddjQHQ3w7-kx2DvJHVPw-7Xe6QxqmELkPOUtI_PC-tjTBKQ7nWt8jx2dS36bjPo7UGnDIMvPl",
    category: "savory",
    badge: "Best seller",
    crunch: 4,
  },
  {
    id: "soul-dog",
    name: "Soul Dog",
    description: "Half beef sausage, half mozzarella block, coated in crispy panko and rolled in sugar.",
    price: 6,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBD1g8cR6ue6JCeBkt6u9ODvJsS-FICRFkLycvoNUPZFUv4SGzHgUVQgLTwQK8eXHHz6zS3Apnrwi4Gm8key5WUb0KlvSCIkrriI_24iNlQVgWCCGuOiy9oIY8RPwyDWN0evy5Lfe7uHxiJGLGNbqSQyNmKi00vaqkGYDa_8QeB0OuuWBRHH1LojnvOkKoWaic5wM4Opxf_Xs2lqXsoe0Wor4BrD44-HtT5C8Bzrf-B5U7ZO8CY4I_S",
    category: "savory",
    crunch: 5,
  },
  {
    id: "neon-fries",
    name: "Neon Fries",
    description: "Crinkle cut fries drenched in liquid gold cheddar, candied bacon dust, and scallions.",
    price: 8,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuANuiJDnbEmyRfw8ekdDqH-09TMD3-LeUQhdCF-RFW2aMnz-SJjirSfmLW0FsIfc9QAFDxU8hL83ofsS03ZUrkHIM3GWCcAuMSgUnHI1KX3QSNsm3Pt8uhdd504ZKZzjZLnesVPOdkQjLPHwimhXzTsJYW9kDpWd5HFngST_jPWqAnTvmBib7czDA1ARL1WdUoKdhnZ8rCPg74ukvwPiXu62KjR8CslW6Qq8mqW3rNHmQEm1pgRte85i",
    category: "sides",
    badge: "New",
    crunch: 2,
  },
  {
    id: "spicy-honey-pepperoni",
    name: "Spicy Honey Pepperoni",
    description: "Thick crust, charred cups, and our signature hot honey drizzle.",
    price: 14,
    image: "/manus-storage/crunch-bite-hero_ea29a631.jpg",
    category: "savory",
    badge: "Hot",
    crunch: 3,
  },
  {
    id: "matcha-cloud-boba",
    name: "Matcha Cloud Boba",
    description: "Ceremonial matcha, brown sugar pearls, and a savory cheese cloud foam.",
    price: 7.5,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAToXdghCpHEt6Iqomv0rjpXB_iBHWVSReD5ScUnPNZPRo3xV2ftA6AraKr5btDpTAIKLgfGBBHpZGs0dUAZ02eAOmhPYZ-nzERM8QEi7NWGoLl5Db1aKln_PNAmYo8kupJFr4N7o3kcMFAUSZirL3YSBCSZzkITC4N1qBRWTjiIRdhaKTz1Xm5ZRul-lf8TuETwfFI6JCLu0x9Ccu3_u5lymZHjXhYaAmI16vU4EErLYqWCZ3gJny2",
    category: "boba",
    badge: "New",
    crunch: 1,
  },
  {
    id: "tiger-sugar-boba",
    name: "Tiger Sugar Crunch Boba",
    description: "Brown sugar pearls, cold brew tea, and a toasted caramel cream cap.",
    price: 6.5,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuANuiJDnbEmyRfw8ekDqH-09TMD3-LeUQhdCF-RFW2aMnz-SJjirSfmLW0FsIfc9QAFDxU8hL83ofsS03ZUrkHIM3GWCcAuMSgUnHI1KX3QSNsm3Pt8uhdd504ZKZzjZLnesVPOdkQjLPHwimhXzTsJYW9kDpWd5HFngST_jPWqAnTvmBib7czDA1ARL1WdUoKdhnZ8rCPg74ukvwPiXu62KjR8CslW6Qq8mqW3rNHmQEm1pgRte85i",
    category: "boba",
    crunch: 2,
  },
  {
    id: "garlic-pork-bites",
    name: "Crunchy Garlic Pork",
    description: "Twice-fried pork belly tossed in sticky garlic soy glaze and chili flakes.",
    price: 12,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_72Dmatc8j1YIhJh-UIrX3bRp8O7J94Jig4st1SSYVNQXZk09vOgOVnBpz0Jk1QIv3gBw6rJnJv4Voe6iYuG7mNFCFUqKYhL0_7jhy54KS8Ww7sSOEFkDZdIOqJRHyiSAnGEQJuokxbRZN5U1L5AsLoZ-BaxAIVFig85vPGbdoDHz29S3sWSRPPD4WktksuEJJ181RxGTxlaZFlAKxKN5IDBPAbJNqIwGCjMOH5fZ6dxT3EjF7R9d",
    category: "sides",
    crunch: 5,
  },
];

export const categoryLabels: Record<MenuCategory, string> = {
  savory: "Savory hits",
  boba: "Boba & sweets",
  sides: "Sides",
};

export const formatPrice = (price: number) => `$${price.toFixed(2)}`;
