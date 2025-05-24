import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create roles
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin' }
    }),
    prisma.role.upsert({
      where: { name: 'company' },
      update: {},
      create: { name: 'company' }
    }),
    prisma.role.upsert({
      where: { name: 'artisan' },
      update: {},
      create: { name: 'artisan' }
    }),
    prisma.role.upsert({
      where: { name: 'user' },
      update: {},
      create: { name: 'user' }
    })
  ]);

  console.log('Roles created:', roles.map(r => r.name).join(', '));

  // Create admin user
  console.log('Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      email_verified_at: new Date()
    }
  });

  // Assign admin role
  await prisma.userRole.upsert({
    where: { 
      user_id_role_id: {
        user_id: admin.id,
        role_id: roles[0].id
      }
    },
    update: {},
    create: {
      user_id: admin.id,
      role_id: roles[0].id
    }
  });

  // Create admin profile
  await prisma.userProfile.upsert({
    where: { user_id: admin.id },
    update: {},
    create: {
      user_id: admin.id,
      bio: 'System administrator'
    }
  });

  console.log('Admin user created:', admin.email);

  // Create company user
  console.log('Creating company user...');
  const companyPassword = await bcrypt.hash('company123', 10);
  
  const company = await prisma.user.upsert({
    where: { email: 'company@example.com' },
    update: {},
    create: {
      name: 'Company User',
      email: 'company@example.com',
      password: companyPassword,
      email_verified_at: new Date()
    }
  });

  // Assign company role
  await prisma.userRole.upsert({
    where: { 
      user_id_role_id: {
        user_id: company.id,
        role_id: roles[1].id
      }
    },
    update: {},
    create: {
      user_id: company.id,
      role_id: roles[1].id
    }
  });

  // Create company profile
  const companyProfile = await prisma.companyProfile.upsert({
    where: { user_id: company.id },
    update: {},
    create: {
      user_id: company.id,
      company_name: 'EcoTextiles Inc.',
      industry: 'Textile Manufacturing',
      description: 'A sustainable textile manufacturing company',
      location: 'New York, USA',
      website: 'https://example.com/ecotextiles'
    }
  });

  console.log('Company user created:', company.email);

  // Create artisan user
  console.log('Creating artisan user...');
  const artisanPassword = await bcrypt.hash('artisan123', 10);
  
  const artisan = await prisma.user.upsert({
    where: { email: 'artisan@example.com' },
    update: {},
    create: {
      name: 'Artisan User',
      email: 'artisan@example.com',
      password: artisanPassword,
      email_verified_at: new Date()
    }
  });

  // Assign artisan role
  await prisma.userRole.upsert({
    where: { 
      user_id_role_id: {
        user_id: artisan.id,
        role_id: roles[2].id
      }
    },
    update: {},
    create: {
      user_id: artisan.id,
      role_id: roles[2].id
    }
  });

  // Create artisan profile
  const artisanProfile = await prisma.artisanProfile.upsert({
    where: { user_id: artisan.id },
    update: {},
    create: {
      user_id: artisan.id,
      artisan_specialty: 'Upcycled Fashion',
      artisan_experience: '5 years',
      materials_interest: 'Cotton, Denim, Silk'
    }
  });

  console.log('Artisan user created:', artisan.email);

  // Create regular user
  console.log('Creating regular user...');
  const userPassword = await bcrypt.hash('user123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Regular User',
      email: 'user@example.com',
      password: userPassword,
      email_verified_at: new Date()
    }
  });

  // Assign user role
  await prisma.userRole.upsert({
    where: { 
      user_id_role_id: {
        user_id: user.id,
        role_id: roles[3].id
      }
    },
    update: {},
    create: {
      user_id: user.id,
      role_id: roles[3].id
    }
  });

  // Create user profile
  await prisma.userProfile.upsert({
    where: { user_id: user.id },
    update: {},
    create: {
      user_id: user.id,
      bio: 'Interested in sustainable fashion',
      location: 'San Francisco, USA'
    }
  });

  console.log('Regular user created:', user.email);

  // Create sample textile waste
  console.log('Creating sample textile waste...');
  
  const textileWaste1 = await prisma.textileWaste.upsert({
    where: { id: 1 },
    update: {},
    create: {
      company_profile_id: companyProfile.id,
      title: 'Cotton Fabric Scraps',
      description: 'High-quality cotton fabric scraps from garment production',
      waste_type: 'Fabric Scraps',
      material_type: 'Cotton',
      quantity: 100.5,
      unit: 'kg',
      condition: 'Excellent',
      color: 'Various',
      composition: '100% Cotton',
      minimum_order_quantity: 5,
      price_per_unit: 2.5,
      location: 'New York, USA',
      availability_status: 'available',
      images: JSON.stringify(['/uploads/textile-waste/sample-cotton.jpg']),
      sustainability_metrics: JSON.stringify({
        'carbon_footprint': 'Low',
        'water_usage': 'Medium'
      })
    }
  });

  const textileWaste2 = await prisma.textileWaste.upsert({
    where: { id: 2 },
    update: {},
    create: {
      company_profile_id: companyProfile.id,
      title: 'Denim Offcuts',
      description: 'Denim fabric offcuts from jeans manufacturing',
      waste_type: 'Fabric Offcuts',
      material_type: 'Denim',
      quantity: 75,
      unit: 'kg',
      condition: 'Good',
      color: 'Blue',
      composition: '95% Cotton, 5% Elastane',
      minimum_order_quantity: 3,
      price_per_unit: 3.2,
      location: 'New York, USA',
      availability_status: 'available',
      images: JSON.stringify(['/uploads/textile-waste/sample-denim.jpg']),
      sustainability_metrics: JSON.stringify({
        'carbon_footprint': 'Medium',
        'water_usage': 'High'
      })
    }
  });

  console.log('Created sample textile waste items');

  // Create sample products
  console.log('Creating sample products...');
  
  const product1 = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      artisan_profile_id: artisanProfile.id,
      name: 'Upcycled Denim Tote Bag',
      description: 'Handmade tote bag created from recycled denim',
      category: 'Bags',
      price: 45.99,
      stock: 15,
      unit: 'piece',
      color: 'Blue',
      material: 'Recycled Denim',
      image: '/uploads/products/sample-tote.jpg',
      is_featured: true
    }
  });

  const product2 = await prisma.product.upsert({
    where: { id: 2 },
    update: {},
    create: {
      artisan_profile_id: artisanProfile.id,
      name: 'Cotton Fabric Scrap Pillow Cover',
      description: 'Eco-friendly pillow cover made from cotton fabric scraps',
      category: 'Home Decor',
      price: 29.99,
      stock: 10,
      unit: 'piece',
      color: 'Multicolor',
      material: 'Recycled Cotton',
      image: '/uploads/products/sample-pillow.jpg',
      is_featured: false
    }
  });

  console.log('Created sample products');

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });