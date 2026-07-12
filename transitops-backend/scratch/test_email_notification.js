'use strict';
require('dotenv').config();

const {
  sendTripDispatchEmail,
  sendIncidentAlertEmail,
  sendMaintenanceAlertEmail
} = require('../src/utils/email');

async function runTests() {
  console.log('--- STARTING EMAIL UTILITY VERIFICATION ---');

  // Test 1: Trip Dispatch Email
  console.log('\n[Test 1] Testing sendTripDispatchEmail...');
  try {
    const result = await sendTripDispatchEmail({
      driverEmail: 'driver@transitops.dev',
      driverName: 'Sam Driver',
      tripNumber: '9999',
      source: 'Warehouse A',
      destination: 'Terminal B',
      vehicleReg: 'MH12AB1234',
      vehicleModel: 'Tata Prima 4028.S',
      cargoWeight: 15000,
      plannedDistance: 120
    });
    console.log('✅ Trip dispatch email test completed successfully:', result);
  } catch (err) {
    console.error('❌ Trip dispatch email test failed:', err);
  }

  // Test 2: Incident Alert Email
  console.log('\n[Test 2] Testing sendIncidentAlertEmail...');
  try {
    const result = await sendIncidentAlertEmail({
      recipients: ['manager@transitops.dev', 'safety@transitops.dev'],
      tripId: 'test-trip-uuid',
      reporterName: 'Ravi Kumar',
      incidentType: 'Vehicle Breakdown',
      location: 'Highway 48, KM 120',
      comments: 'Engine overheating, coolant leaking. Tow truck required.',
      photoUrl: 'http://example.com/photo.jpg'
    });
    console.log('✅ Incident alert email test completed successfully:', result);
  } catch (err) {
    console.error('❌ Incident alert email test failed:', err);
  }

  // Test 3: Maintenance Notification
  console.log('\n[Test 3] Testing sendMaintenanceAlertEmail...');
  try {
    const resultOpen = await sendMaintenanceAlertEmail({
      recipients: ['manager@transitops.dev', 'dispatcher@transitops.dev'],
      vehicleReg: 'MH14CD5678',
      vehicleModel: 'Ashok Leyland Boss',
      status: 'Open',
      description: 'Brake pad replacement and engine tuning.',
      cost: 5000
    });
    console.log('✅ Maintenance Open email test completed successfully:', resultOpen);

    const resultClose = await sendMaintenanceAlertEmail({
      recipients: ['manager@transitops.dev', 'dispatcher@transitops.dev'],
      vehicleReg: 'MH14CD5678',
      vehicleModel: 'Ashok Leyland Boss',
      status: 'Closed',
      description: 'Brake pad replacement and engine tuning.',
      cost: 5200
    });
    console.log('✅ Maintenance Close email test completed successfully:', resultClose);
  } catch (err) {
    console.error('❌ Maintenance alert email test failed:', err);
  }

  console.log('\n--- EMAIL UTILITY VERIFICATION COMPLETED ---');
  process.exit(0);
}

runTests();
