import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const mssqlConnection = dataSource.driver.connectionPool ? dataSource : app.get('mssqlConnectionConnection'); // Adjust if named connection
  
  const news = await dataSource.query(`SELECT DISTINCT department FROM news WHERE department IS NOT NULL AND status != 3`);
  console.log('DISTINCT Departments in News:', news);
  
  const ids = news.map(n => n.department);
  if (ids.length > 0) {
    const formattedIds = ids.map(id => `'${id}'`).join(',');
    const orgs = await dataSource.query(`SELECT id, name FROM organization_units WHERE id IN (${formattedIds})`);
    console.log('Matched Orgs:', orgs);
  } else {
    console.log('No department IDs found in news.');
  }

  await app.close();
}

bootstrap();
