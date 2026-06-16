import 'dotenv/config';
import { createSeedContext } from './seed-context';
import { seedPlatformAdmin } from './platform-admin.seed';
import { seedPlatformPermissions } from './platform-permissions.seed';
import { seedProducts } from './products.seed';
import { seedServiceClients } from './service-clients.seed';
import { seedCustomerRoles } from './customer-roles.seed';
import { seedInternalWorkforceRoles } from './internal-workforce-roles.seed';
import { seedInternalAccessControlRoles } from './internal-access-control-roles.seed';
import { seedInternalWorkforceContractsRoles } from './internal-workforce-contracts-roles.seed';
import { seedInternalAccreditationRoles } from './internal-accreditation-roles.seed';

async function main() {
  const context = createSeedContext();

  try {
    await seedPlatformPermissions(context);
    await seedProducts(context);
    const customerRolesResult = await seedCustomerRoles(context);
    const internalWorkforceRolesResult = await seedInternalWorkforceRoles(context);
    const internalWorkforceContractsRolesResult =
      await seedInternalWorkforceContractsRoles(context);
    const internalAccreditationRolesResult = await seedInternalAccreditationRoles(context);
    const internalAccessControlRolesResult = await seedInternalAccessControlRoles(context);
    const adminResult = await seedPlatformAdmin(context);
    const serviceClientResults = await seedServiceClients(context);

    console.log('Seeds completed', {
      adminResult,
      productsSeeded: true,
      customerRolesResult,
      internalWorkforceRolesResult,
      internalWorkforceContractsRolesResult,
      internalAccreditationRolesResult,
      internalAccessControlRolesResult,
      serviceClientResults,
    });
  } finally {
    await context.pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
