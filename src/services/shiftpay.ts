/**
 * ShiftPay Frontend Service Module
 * Handles interactions with backend and Soroban smart contracts for Mobile Worker Web Application.
 */

export interface WorkerState {
  workerAddress: string;
  claimableBalance: number; // Kilitli hakediş bakiyesi (TL / Stellar Asset)
  debtTL: number;           // Varsa borç durumu (TL)
  isVested: boolean;        // Vadesinin dolup dolmadığı
  isMatured: boolean;       // Vadesinin dolup dolmadığı (Vade Durumu)
  dailyLimitTL: number;     // Günlük harcama limiti (TL)
  spentTodayTL: number;     // Bugün harcanan toplam tutar (TL)
}

export interface TransactionResult {
  success: boolean;
  message: string;
  txHash?: string;
}

export interface CheckInResponse extends TransactionResult {
  shiftId: string;
  checkInTime: string;
}

export interface CheckOutResponse extends TransactionResult {
  earnedTL: number;
  deductedDebtTL: number;
  remainingClaimableTL: number;
  remainingDebtTL: number;
  isMatured: boolean;
}

export interface MerchantPaymentResponse extends TransactionResult {
  amountTL?: number;
  merchantAddress?: string;
  remainingClaimableTL?: number;
  spentTodayTL?: number;
}

// In-memory state tracking for production initial state
let mockSpentToday = 0.0;
let mockClaimableBalance = 0.0;
let mockDebtTL = 0.0;
let mockIsMatured = false;
const MOCK_DAILY_LIMIT = 800.0;

/**
 * İşçinin kilitli hakediş bakiyesini, borç durumunu, vade doluluk bilgisini ve günlük limit durumunu getirir.
 * Canlı başlangıç modunda varsayılan bakiye 0.00 TL ve borç 0.00 TL olarak başlar.
 */
export async function getWorkerState(workerAddress: string): Promise<WorkerState> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    workerAddress,
    claimableBalance: mockClaimableBalance,
    debtTL: mockDebtTL,
    isVested: mockIsMatured,
    isMatured: mockIsMatured,
    dailyLimitTL: MOCK_DAILY_LIMIT,
    spentTodayTL: mockSpentToday,
  };
}

/**
 * Kullanıcının var olan borcunu kapatmak veya hesabına TL bütçesi yüklemek için çalışan fonksiyon.
 */
export async function depositTL(
  workerAddress: string,
  amountTL: number
): Promise<TransactionResult & { newDebtTL: number; newClaimableBalance: number }> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  mockDebtTL = Math.max(0, mockDebtTL - amountTL);
  mockClaimableBalance += amountTL;
  mockIsMatured = true;

  return {
    success: true,
    message: `${amountTL} TL yükleme / borç ödemesi başarıyla gerçekleştirildi.`,
    txHash: '0x' + Math.random().toString(16).substring(2, 42),
    newDebtTL: mockDebtTL,
    newClaimableBalance: mockClaimableBalance,
  };
}

/**
 * Kamera ile QR okutulduğunda işe girişi tetikleyen fonksiyon.
 */
export async function checkIn(
  workerAddress: string,
  shiftId: string
): Promise<CheckInResponse> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    success: true,
    message: 'İşe giriş (Check-In) başarıyla kaydedildi.',
    shiftId,
    checkInTime: new Date().toISOString(),
    txHash: '0x' + Math.random().toString(16).substring(2, 42),
  };
}

/**
 * İşten çıkışı yapan, günlük hakedişi ekleyip varsa geçmiş borcu otomatik mahsup eden fonksiyon.
 */
export async function checkOut(
  employerAddress: string,
  workerAddress: string
): Promise<CheckOutResponse> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const dailyEarned = 800.0;
  const currentDebt = mockDebtTL;
  const deducted = Math.min(dailyEarned, currentDebt);
  const netEarnings = dailyEarned - deducted;

  mockDebtTL = currentDebt - deducted;
  mockClaimableBalance += netEarnings;
  mockIsMatured = true; // Vardiya tamamlandığında hakediş kilitli süreci dolar veya FAST çekimine uygun hale gelir

  return {
    success: true,
    message: 'İşten çıkış (Check-Out) tamamlandı. Günlük hakediş hesaba işlendi.',
    earnedTL: dailyEarned,
    deductedDebtTL: deducted,
    remainingClaimableTL: mockClaimableBalance,
    remainingDebtTL: mockDebtTL,
    isMatured: true,
    txHash: '0x' + Math.random().toString(16).substring(2, 42),
  };
}

/**
 * Mağazada anında QR ile ödeme yaptıran fonksiyon.
 * Günlük Harcama Limiti (Daily Spending Cap) kontrolü içerir.
 */
export async function spendAtMerchant(
  workerAddress: string,
  merchantAddress: string,
  amountTL: number
): Promise<MerchantPaymentResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Daily Limit Control
  if (amountTL + mockSpentToday > MOCK_DAILY_LIMIT) {
    return {
      success: false,
      message: `Günlük harcama limitinizi (${MOCK_DAILY_LIMIT} TL) aştınız! (Bugün Harcanan: ${mockSpentToday} TL)`,
    };
  }

  mockSpentToday += amountTL;
  mockClaimableBalance = Math.max(0, mockClaimableBalance - amountTL);

  return {
    success: true,
    message: `${amountTL} TL tutarındaki ödeme üye işyerinde başarıyla gerçekleştirildi.`,
    amountTL,
    merchantAddress,
    remainingClaimableTL: mockClaimableBalance,
    spentTodayTL: mockSpentToday,
    txHash: '0x' + Math.random().toString(16).substring(2, 42),
  };
}

/**
 * Vadesi dolan hakedişi SEP-24 Anchor entegrasyonu üzerinden FAST ile IBAN'a aktarmak için off-ramp bağlantısı üreten fonksiyon.
 */
export async function getAnchorOfframpUrl(
  iban: string,
  amountTL: number
): Promise<{ offrampUrl: string; transactionId: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const cleanIban = iban.replace(/\s+/g, '');
  const mockTxId = 'sep24-tx-' + Math.random().toString(36).substring(2, 10);
  const anchorDomain = process.env.NEXT_PUBLIC_ANCHOR_DOMAIN || 'https://anchor.shiftpay.example';

  const params = new URLSearchParams({
    asset_code: 'TRY',
    account: cleanIban,
    amount: amountTL.toString(),
    type: 'offramp',
    tx_id: mockTxId,
  });

  return {
    offrampUrl: `${anchorDomain}/sep24/interactive?${params.toString()}`,
    transactionId: mockTxId,
  };
}
