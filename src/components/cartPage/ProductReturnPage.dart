import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:developer';
import 'package:sadhana_cart/core/common%20model/order/order_model.dart';
import 'package:sadhana_cart/core/widgets/snack_bar.dart';
import 'package:sadhana_cart/core/widgets/loader.dart';

class ProductReturnPage extends ConsumerStatefulWidget {
  final OrderModel order;
  final OrderProductModel product;

  const ProductReturnPage({
    super.key,
    required this.order,
    required this.product,
  });

  @override
  ConsumerState<ProductReturnPage> createState() =>
      _ProductReturnPageState();
}

class _ProductReturnPageState extends ConsumerState<ProductReturnPage> {
  final descriptionController = TextEditingController();
  final accountNameController = TextEditingController();
  final accountNumberController = TextEditingController();
  final ifscController = TextEditingController();

  bool isLoading = false;
  String refundType = "wallet";

  final List<String> _reasons = [
    'Received wrong item',
    'Defective / Damaged',
    'Quality not as expected',
    'Missing parts',
    'Other',
  ];
  String? selectedReason;

  double get totalOrderAmount => widget.order.totalAmount;

  double get productAmount => widget.product.price ?? 0;

  double get proportion =>
      totalOrderAmount == 0 ? 0 : productAmount / totalOrderAmount;

  double get usedCoins =>
      (widget.order.toMap()['usedCoins'] as num?)?.toDouble() ?? 0;

  double get payableAmount =>
      (widget.order.toMap()['payableAmount'] as num?)
          ?.toDouble() ??
          totalOrderAmount;

  double get coinsToRefund => usedCoins * proportion;

  double get amountToRefund => payableAmount * proportion;

  bool _isValidIFSC(String ifsc) {
    final regex = RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$');
    return regex.hasMatch(ifsc.replaceAll(' ', ''));
  }

  Future<void> submitReturnRequest() async {
    final reasonText = selectedReason == 'Other'
        ? descriptionController.text.trim()
        : (selectedReason ?? '');

    if (selectedReason == null || selectedReason!.isEmpty) {
      showCustomSnackbar(
        context: context,
        message: "Please select a reason",
        type: ToastType.error,
      );
      return;
    }

    if (selectedReason == 'Other' && reasonText.isEmpty) {
      showCustomSnackbar(
        context: context,
        message: "Please describe the issue for 'Other'",
        type: ToastType.error,
      );
      return;
    }

    if (refundType == "bank") {
      final accName = accountNameController.text.trim();
      final accNum = accountNumberController.text.trim();
      final ifsc = ifscController.text.trim().replaceAll(' ', '');

      if (accName.isEmpty || accNum.isEmpty || ifsc.isEmpty) {
        showCustomSnackbar(
          context: context,
          message: "Please fill all bank details",
          type: ToastType.error,
        );
        return;
      }

      if (!_isValidIFSC(ifsc)) {
        showCustomSnackbar(
          context: context,
          message: "Enter valid IFSC code (e.g., SBIN0001234)",
          type: ToastType.error,
        );
        return;
      }
    }

    setState(() => isLoading = true);

    try {
      final userId = FirebaseAuth.instance.currentUser!.uid;
      final returnRef = FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .collection('return_requests')
          .doc();

      final returnData = {
        "returnId": returnRef.id,
        "userId": userId,
        "orderId": widget.order.orderId,
        "productId": widget.product.productid,
        "productName": widget.product.name,
        "quantity": widget.product.quantity,
        "reason": selectedReason,
        "description": reasonText,
        "refundType": refundType,
        "bankDetails": refundType == "bank"
            ? {
          "accountName": accountNameController.text.trim(),
          "accountNumber": accountNumberController.text.trim(),
          "ifsc": ifscController.text.trim(),
        }
            : null,
        "refundAmount": amountToRefund,
        "coinsToRefund": coinsToRefund.round(),
        "billing_customer_name": "Customer",
        "status": "return_requested",
        "requestedAt": Timestamp.now(),
        "updatedAt": Timestamp.now(),
      };

      await returnRef.set(returnData);

      final updatedProducts = widget.order.products.map((p) {
        if (p.productid == widget.product.productid) {
          return p.copyWith(
            returnStatus: "return_requested",
            returnInfo: {
              "returnId": returnRef.id,
              "refundType": refundType,
              "refundAmount": amountToRefund,
              "coinsToRefund": coinsToRefund.round(),
            },
          );
        }
        return p;
      }).toList();

      await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .collection('orders')
          .doc(widget.order.orderId)
          .update({
        "products": updatedProducts.map((e) => e.toMap()).toList(),
      });

      // 🔥 Create Shiprocket return order (Firestore trigger will handle on approval)
      log("✅ Return request created: ${returnRef.id}");

      showCustomSnackbar(
        context: context,
        message: "Return request submitted successfully",
        type: ToastType.success,
      );

      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      log("Return submission error: $e");
      showCustomSnackbar(
        context: context,
        message: "Failed to submit return request: ${e.toString()}",
        type: ToastType.error,
      );
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  void dispose() {
    descriptionController.dispose();
    accountNameController.dispose();
    accountNumberController.dispose();
    ifscController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Return Product"),
        foregroundColor: cs.onPrimary,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.product.name ?? "--",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: cs.onSurface,
              ),
            ),
            const SizedBox(height: 12),

            // Summary Cards
            Row(
              children: [
                Expanded(
                  child: Card(
                    color: cs.surfaceContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Product Amount",
                            style: TextStyle(
                              color: cs.onSurface.withOpacity(0.7),
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "₹${productAmount.toStringAsFixed(2)}",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: cs.onSurface,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Card(
                    color: cs.surfaceContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Refund (est)",
                            style: TextStyle(
                              color: cs.onSurface.withOpacity(0.7),
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "₹${amountToRefund.toStringAsFixed(2)}",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: cs.primary,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            "Coins: ${coinsToRefund.round()}",
                            style: TextStyle(color: cs.onSurface.withOpacity(0.7)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Refund Method
            Text(
              "Refund Method",
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 16,
                color: cs.onSurface,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ChoiceChip(
                    label: const Text('Wallet'),
                    selected: refundType == 'wallet',
                    selectedColor: cs.primaryContainer,
                    onSelected: (_) => setState(() => refundType = 'wallet'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ChoiceChip(
                    label: const Text('Bank'),
                    selected: refundType == 'bank',
                    selectedColor: cs.primaryContainer,
                    onSelected: (_) => setState(() => refundType = 'bank'),
                  ),
                ),
              ],
            ),

            if (refundType == "bank") ...[
              const SizedBox(height: 16),
              TextField(
                controller: accountNameController,
                decoration: InputDecoration(
                  labelText: "Account Holder Name",
                  labelStyle: TextStyle(color: cs.onSurfaceVariant),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  filled: true,
                  fillColor: cs.surfaceContainer,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: accountNumberController,
                decoration: InputDecoration(
                  labelText: "Account Number",
                  labelStyle: TextStyle(color: cs.onSurfaceVariant),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  filled: true,
                  fillColor: cs.surfaceContainer,
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: ifscController,
                decoration: InputDecoration(
                  labelText: "IFSC Code",
                  labelStyle: TextStyle(color: cs.onSurfaceVariant),
                  hintText: "e.g., SBIN0001234",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  filled: true,
                  fillColor: cs.surfaceContainer,
                ),
                keyboardType: TextInputType.text,
                textCapitalization: TextCapitalization.characters,
              ),
            ],

            const SizedBox(height: 24),

            // Reason Selection
            Text(
              "Reason for Return",
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 16,
                color: cs.onSurface,
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: selectedReason,
              items: _reasons
                  .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                  .toList(),
              onChanged: (v) {
                setState(() => selectedReason = v);
                if (v != 'Other') {
                  descriptionController.clear();
                }
              },
              decoration: InputDecoration(
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                filled: true,
                fillColor: cs.surfaceContainer,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descriptionController,
              maxLines: selectedReason == 'Other' ? 4 : 3,
              enabled: selectedReason == 'Other',
              decoration: InputDecoration(
                labelText: selectedReason == 'Other'
                    ? 'Describe the issue *'
                    : 'Additional details (optional)',
                labelStyle: TextStyle(color: cs.onSurfaceVariant),
                hintText: selectedReason == 'Other'
                    ? 'Explain why you want to return this item'
                    : 'Optional details',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                filled: true,
                fillColor: cs.surfaceContainer,
              ),
            ),

            const SizedBox(height: 32),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: isLoading ? null : () => Navigator.pop(context, false),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: isLoading ? null : submitReturnRequest,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                    ),
                    child: isLoading
                        ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: Loader(size: 18),
                    )
                        : const Text("Submit Return"),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}