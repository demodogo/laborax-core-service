import { products } from '../schemas';
import type { SeedContext } from './seed-context';

const platformProducts = [
  {
    code: 'SCC' as const,
    name: 'SCC',
    description: 'Suite de control y acreditacion de contratistas',
  },
  {
    code: 'SCA' as const,
    name: 'SCA',
    description: 'Control de acceso operacional',
  },
  {
    code: 'CERTIFICAX' as const,
    name: 'CertificaX',
    description: 'Gestion documental y certificacion extendida',
  },
] as const;

export async function seedProducts({ db }: SeedContext) {
  await db
    .insert(products)
    .values(
      platformProducts.map((product) => ({
        code: product.code,
        name: product.name,
        description: product.description,
        status: 'ACTIVE' as const,
      })),
    )
    .onConflictDoNothing({
      target: products.code,
    });
}
