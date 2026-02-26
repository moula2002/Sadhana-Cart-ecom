// // pages/api/orders/cancel-request.js
// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   try {
//     const {
//       shiprocketOrderId,
//       orderDocId,
//       reason,
//       needsReconcile,
//       shipmentId,
//       shiprocketAttemptedResponse
//     } = req.body;

//     // Here you would save to your database
//     // Example with MongoDB:
//     // const cancelRequest = await CancelRequest.create({
//     //   shiprocketOrderId,
//     //   orderDocId,
//     //   reason,
//     //   needsReconcile,
//     //   shipmentId,
//     //   shiprocketAttemptedResponse,
//     //   status: 'pending',
//     //   createdAt: new Date()
//     // });

//     res.status(200).json({ 
//       success: true, 
//       message: 'Cancel request saved successfully'
//     });
//   } catch (error) {
//     console.error('Error saving cancel request:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// }