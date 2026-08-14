// Resilient first-paint catalog. The storefront replaces this snapshot with the persisted database catalog as soon as the public query resolves.
import type { CatalogProduct } from "./catalog-types";

export const fallbackCatalog = {
  categories: [
    { id: 1, slug: "boba", name: "Boba", sortOrder: 1 },
    { id: 2, slug: "yogurt", name: "Yogurt", sortOrder: 2 },
    { id: 3, slug: "ice-cream", name: "Ice cream", sortOrder: 3 },
    { id: 4, slug: "pizza", name: "Pizza", sortOrder: 4 },
    { id: 5, slug: "fries", name: "Fries", sortOrder: 5 },
    { id: 6, slug: "pork", name: "Pork", sortOrder: 6 },
  ],
  products: [
    { id: "matcha-cloud-boba", name: "Matcha Cloud Boba", description: "Ceremonial matcha, brown sugar pearls, and a savory cheese cloud foam.", pricePesewas: 7500, imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAToXdghCpHEt6Iqomv0rjpXB_iBHWVSReD5ScUnPNZPRo3xV2ftA6AraKr5btDpTAIKLgfGBBHpZGs0dUAZ02eAOmhPYZ-nzERM8QEi7NWGoLl5Db1aKln_PNAmYo8kupJFr4N7o3kcMFAUSZirL3YSBCSZzkITC4N1qBRWTjiIRdhaKTz1Xm5ZRul-lf8TuETwfFI6JCLu0x9Ccu3_u5lymZHjXhYaAmI16vU4EErLYqWCZ3gJny2", badge: "New", crunchLevel: 1, categorySlug: "boba", categoryName: "Boba", sortOrder: 1 },
    { id: "tiger-sugar-boba", name: "Tiger Sugar Crunch Boba", description: "Brown sugar pearls, cold brew tea, and a toasted caramel cream cap.", pricePesewas: 6500, imageUrl: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=85", badge: null, crunchLevel: 2, categorySlug: "boba", categoryName: "Boba", sortOrder: 2 },
    { id: "mango-crunch-yogurt", name: "Mango Crunch Yogurt", description: "Creamy Greek-style yogurt, bright mango, toasted granola, and a honey finish.", pricePesewas: 5500, imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85", badge: "Fresh", crunchLevel: 3, categorySlug: "yogurt", categoryName: "Yogurt", sortOrder: 1 },
    { id: "black-sesame-ice-cream", name: "Black Sesame Ice Cream", description: "Silky black sesame ice cream with caramel crunch and roasted peanut dust.", pricePesewas: 4500, imageUrl: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=900&q=85", badge: "Cold drop", crunchLevel: 2, categorySlug: "ice-cream", categoryName: "Ice cream", sortOrder: 1 },
    { id: "spicy-honey-pepperoni", name: "Spicy Honey Pepperoni", description: "Thick crust, charred cups, and our signature hot honey drizzle.", pricePesewas: 14000, imageUrl: "/manus-storage/crunch-bite-hero_ea29a631.jpg", badge: "Hot", crunchLevel: 3, categorySlug: "pizza", categoryName: "Pizza", sortOrder: 1 },
    { id: "neon-fries", name: "Neon Fries", description: "Crinkle cut fries drenched in liquid gold cheddar, candied bacon dust, and scallions.", pricePesewas: 8000, imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBD1g8cR6ue6JCeBkt6u9ODvJsS-FICRFkLycvoNUPZFUv4SGzHgUVQgLTwQK8eXHHz6zS3Apnrwi4Gm8key5WUb0KlvSCIkrriI_24iNlQVgWCCGuOiy9oIY8RPwyDWN0evy5Lfe7uHxiJGLGNbqSQyNmKi00vaqkGYDa_8QeB0OuuWBRHH1LojnvOkKoWaic5wM4Opxf_Xs2lqXsoe0Wor4BrD44-HtT5C8Bzrf-B5U7ZO8CY4I_S", badge: "New", crunchLevel: 4, categorySlug: "fries", categoryName: "Fries", sortOrder: 1 },
    { id: "crunchy-garlic-pork", name: "Crunchy Garlic Pork", description: "Twice-fried pork belly tossed in sticky garlic soy glaze and chili flakes.", pricePesewas: 12000, imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_72Dmatc8j1YIhJh-UIrX3bRp8O7J94Jig4st1SSYVNQXZk09vOgOVnBpz0Jk1QIv3gBw6rJnJv4Voe6iYuG7mNFCFUqKYhL0_7jhy54KS8Ww7sSOEFkDZdIOqJRHyiSAnGEQJuokxbRZN5U1L5AsLoZ-BaxAIVFig85vPGbdoDHz29S3sWSRPPD4WktksuEJJ181RxGTxlaZFlAKxKN5IDBPAbJNqIwGCjMOH5fZ6dxT3EjF7R9d", badge: null, crunchLevel: 5, categorySlug: "pork", categoryName: "Pork", sortOrder: 1 },
  ] satisfies CatalogProduct[],
};
