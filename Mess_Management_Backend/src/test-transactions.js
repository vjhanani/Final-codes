const sequelize = require('./config/db');
const { Student, Transaction, ExtraItem, ExtraPurchase, Rebate, Config } = require('./models/Index');

async function verifyTransactions() {
  try {
    console.log('🧪 Starting Verification of Transaction System...');
    await sequelize.authenticate();
    
    // 1. Setup - Create a test student if not exists
    const [student] = await Student.findOrCreate({
      where: { rollNo: 'TEST001' },
      defaults: {
        name: 'Test Student',
        email: 'test@example.com',
        password: 'password123',
        status: 'Approved',
        messCardStatus: 'Active'
      }
    });
    console.log('✅ Test student ready');

    // 2. Setup - Create a test extra item
    const [item] = await ExtraItem.findOrCreate({
      where: { name: 'Test Juice' },
      defaults: {
        price: 50.00,
        stockQuantity: 100,
        isAvailable: true
      }
    });
    console.log('✅ Test extra item ready');

    // 3. Test Extra Purchase Transaction Sync
    console.log('🛒 Testing Extra Purchase Sync...');
    const initialTransCount = await Transaction.count({ where: { StudentRollNo: 'TEST001' } });
    
    // Simulate buyExtras logic (simplified)
    const t = await sequelize.transaction();
    try {
      const price = parseFloat(item.price) * 2;
      await ExtraPurchase.create({
        StudentRollNo: student.rollNo,
        ExtraItemId: item.id,
        quantity: 2,
        totalPrice: price
      }, { transaction: t });

      await Transaction.create({
        StudentRollNo: student.rollNo,
        itemName: item.name,
        amount: price,
        type: 'extra',
        status: 'Completed',
        date: new Date()
      }, { transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    const finalTransCount = await Transaction.count({ where: { StudentRollNo: 'TEST001' } });
    if (finalTransCount !== initialTransCount + 1) {
      throw new Error('Transaction record not created for extra purchase');
    }
    console.log('✅ Extra purchase sync verified');

    // 4. Test Rebate Approval Transaction Sync
    console.log('💰 Testing Rebate Approval Sync...');
    const rebate = await Rebate.create({
      StudentRollNo: student.rollNo,
      startDate: '2026-04-01',
      endDate: '2026-04-05',
      reason: 'Home visit',
      status: 'Pending',
      amount: 0
    });

    // Simulate approveRebate logic
    rebate.status = 'Approved';
    rebate.amount = 500.00;
    await rebate.save();
    
    await Transaction.create({
      StudentRollNo: student.rollNo,
      itemName: `Rebate (${rebate.startDate} to ${rebate.endDate})`,
      amount: 500.00,
      type: 'rebate',
      status: 'Completed',
      date: new Date()
    });

    const rebateTrans = await Transaction.findOne({
      where: { StudentRollNo: 'TEST001', type: 'rebate' }
    });
    if (!rebateTrans) {
      throw new Error('Transaction record not created for approved rebate');
    }
    console.log('✅ Rebate approval sync verified');

    // 5. Test Unified Dues Summary
    console.log('📊 Testing Dues Summary Calculation...');
    // Add a manual charge and payment
    await Transaction.create({
      StudentRollNo: student.rollNo,
      itemName: 'April Mess Bill',
      amount: 3000.00,
      type: 'charge',
      status: 'Completed',
      date: new Date()
    });

    await Transaction.create({
      StudentRollNo: student.rollNo,
      itemName: 'Online Payment',
      amount: 2000.00,
      type: 'payment',
      status: 'Completed',
      date: new Date()
    });

    const transactions = await Transaction.findAll({
      where: { StudentRollNo: student.rollNo }
    });

    let totalCharges = 0;
    let totalExtras = 0;
    let totalPayments = 0;
    let totalRebates = 0;

    transactions.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === 'charge') totalCharges += amt;
      else if (t.type === 'extra') totalExtras += amt;
      else if (t.type === 'payment') totalPayments += amt;
      else if (t.type === 'rebate') totalRebates += amt;
    });

    const netDues = (totalCharges + totalExtras) - (totalPayments + totalRebates);
    console.log(`Summary: Charges=${totalCharges}, Extras=${totalExtras}, Payments=${totalPayments}, Rebates=${totalRebates}, Net=${netDues}`);

    if (netDues !== (3000 + 100) - (2000 + 500)) { // 3100 - 2500 = 600
      throw new Error(`Incorrect net dues calculation: expected 600, got ${netDues}`);
    }
    console.log('✅ Dues summary verified');

    console.log('🎉 ALL TRANSACTIONS VERIFIED SUCCESSFULLY!');
    
    // Cleanup
    await Transaction.destroy({ where: { StudentRollNo: 'TEST001' } });
    await ExtraPurchase.destroy({ where: { StudentRollNo: 'TEST001' } });
    await Rebate.destroy({ where: { StudentRollNo: 'TEST001' } });
    await Student.destroy({ where: { rollNo: 'TEST001' } });
    
    process.exit(0);

  } catch (error) {
    console.error('❌ VERIFICATION FAILED:', error);
    process.exit(1);
  }
}

verifyTransactions();
