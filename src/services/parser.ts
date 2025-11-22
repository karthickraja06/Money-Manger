/**
 * Transaction Parser Service
 * Parses SMS messages to extract transaction data
 * Supports multiple bank formats
 */

import { RawSMS } from '../types';

export interface ParsedSMS {
  type: 'debit' | 'credit' | 'atm' | 'cash' | 'upi';
  amount: number;
  merchant?: string;
  account?: string;
  date: Date;
  reference?: string;
  bank?: string;
  rawSMS: RawSMS;
}

export class TransactionParser {
  /**
   * Parse SMS to extract transaction data
   * Detects bank type and uses appropriate parser
   */
  static parse(sms: RawSMS): ParsedSMS | null {
    try {
      // Detect bank from sender
      const bank = this.detectBank(sms.sender);
      
      console.log(`🔍 Parsing SMS from ${bank}...`);

      // Route to appropriate parser
      switch (bank) {
        case 'HDFC':
          return this.parseHDFC(sms);
        case 'ICICI':
          return this.parseICICI(sms);
        case 'AXIS':
          return this.parseAXIS(sms);
        case 'SBI':
          return this.parseSBI(sms);
        case 'UPI':
          return this.parseUPI(sms);
        default:
          return this.parseGeneric(sms);
      }
    } catch (error) {
      console.error('❌ Failed to parse SMS:', error);
      return null;
    }
  }

  /**
   * Detect bank from SMS sender
   */
  private static detectBank(sender: string): string {
    const senderLower = sender.toLowerCase();
    
    if (senderLower.includes('hdfc')) return 'HDFC';
    if (senderLower.includes('icici')) return 'ICICI';
    if (senderLower.includes('axis')) return 'AXIS';
    if (senderLower.includes('sbi')) return 'SBI';
    if (senderLower.includes('upi') || senderLower.includes('pay')) return 'UPI';
    
    return 'UNKNOWN';
  }

  /**
   * Parse HDFC Bank SMS
   * Format: "Debit card xxx debited for Rs.X,XXX on MERCHANT. Bal: X,XXX. Ref: XYZ"
   */
  private static parseHDFC(sms: RawSMS): ParsedSMS | null {
    const text = sms.body;

    // Amount regex: "Rs.X,XXX" or "Rs X,XXX"
    const amountMatch = text.match(/Rs\.?\s*([\d,]+)/i);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

    // Type detection
    let type: ParsedSMS['type'] = 'debit';
    if (text.toLowerCase().includes('credit')) type = 'credit';
    if (text.toLowerCase().includes('atm')) type = 'atm';

    // Merchant/description
    const merchantMatch = text.match(/on\s+([A-Z\s]+)\./i);
    const merchant = merchantMatch?.[1]?.trim();

    // Reference
    const refMatch = text.match(/Ref:\s*([A-Z0-9]+)/i);
    const reference = refMatch?.[1];

    // Account info
    const accountMatch = text.match(/card.*?(\d{4})/i);
    const account = accountMatch?.[1];

    return {
      type,
      amount,
      merchant,
      account,
      date: new Date(sms.timestamp),
      reference,
      bank: 'HDFC',
      rawSMS: sms,
    };
  }

  /**
   * Parse ICICI Bank SMS
   * Format: "Amount Rs.X,XXX has been debited. Txn Ref: XYZ. Balance: X,XXX"
   */
  private static parseICICI(sms: RawSMS): ParsedSMS | null {
    const text = sms.body;

    // Amount regex
    const amountMatch = text.match(/Rs\.?\s*([\d,]+)/i);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

    // Type detection
    let type: ParsedSMS['type'] = 'debit';
    if (text.toLowerCase().includes('credited')) type = 'credit';

    // Reference
    const refMatch = text.match(/Txn Ref:\s*([A-Z0-9]+)/i);
    const reference = refMatch?.[1];

    // Merchant (ICICI usually doesn't include merchant in SMS)
    const merchant = text.match(/at\s+([A-Z\s]+)/i)?.[1]?.trim();

    return {
      type,
      amount,
      merchant,
      date: new Date(sms.timestamp),
      reference,
      bank: 'ICICI',
      rawSMS: sms,
    };
  }

  /**
   * Parse AXIS Bank SMS
   * Format: "Amount Rs.X,XXX debited towards MERCHANT. Ref: XYZ. Bal: X,XXX"
   */
  private static parseAXIS(sms: RawSMS): ParsedSMS | null {
    const text = sms.body;

    // Amount regex
    const amountMatch = text.match(/Rs\.?\s*([\d,]+)/i);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

    // Type detection
    let type: ParsedSMS['type'] = 'debit';
    if (text.toLowerCase().includes('credited')) type = 'credit';

    // Merchant
    const merchantMatch = text.match(/towards\s+([A-Z\s]+)\./i);
    const merchant = merchantMatch?.[1]?.trim();

    // Reference
    const refMatch = text.match(/Ref:\s*([A-Z0-9]+)/i);
    const reference = refMatch?.[1];

    return {
      type,
      amount,
      merchant,
      date: new Date(sms.timestamp),
      reference,
      bank: 'AXIS',
      rawSMS: sms,
    };
  }

  /**
   * Parse SBI Bank SMS
   */
  private static parseSBI(sms: RawSMS): ParsedSMS | null {
    const text = sms.body;

    // Amount regex
    const amountMatch = text.match(/Rs\.?\s*([\d,]+)/i);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

    // Type detection
    let type: ParsedSMS['type'] = 'debit';
    if (text.toLowerCase().includes('credit')) type = 'credit';

    // Merchant
    const merchantMatch = text.match(/at\s+([A-Z\s]+)/i);
    const merchant = merchantMatch?.[1]?.trim();

    return {
      type,
      amount,
      merchant,
      date: new Date(sms.timestamp),
      bank: 'SBI',
      rawSMS: sms,
    };
  }

  /**
   * Parse UPI Transaction SMS
   * Format: "Payment successful. Rs.X,XXX transferred to RECIPIENT@UPI"
   */
  private static parseUPI(sms: RawSMS): ParsedSMS | null {
    const text = sms.body;

    // Amount regex
    const amountMatch = text.match(/Rs\.?\s*([\d,]+)/i);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

    // UPI recipient
    const recipientMatch = text.match(/to\s+([A-Za-z0-9@.]+)/i);
    const merchant = recipientMatch?.[1];

    // Reference
    const refMatch = text.match(/Ref:\s*([A-Z0-9]+)/i);
    const reference = refMatch?.[1];

    return {
      type: 'upi',
      amount,
      merchant,
      date: new Date(sms.timestamp),
      reference,
      bank: 'UPI',
      rawSMS: sms,
    };
  }

  /**
   * Generic parser for unknown formats
   * Attempts basic extraction
   */
  private static parseGeneric(sms: RawSMS): ParsedSMS | null {
    const text = sms.body;

    // Basic amount extraction
    const amountMatch = text.match(/([₹$]|Rs\.?)\s*([\d,]+)/i);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[2].replace(/,/g, ''));

    // Basic type detection
    const type: ParsedSMS['type'] = text.toLowerCase().includes('debit')
      ? 'debit'
      : text.toLowerCase().includes('credit')
      ? 'credit'
      : 'cash';

    return {
      type,
      amount,
      date: new Date(sms.timestamp),
      rawSMS: sms,
    };
  }

  /**
   * Validate parsed transaction
   */
  static validate(parsed: ParsedSMS): boolean {
    // Amount must be positive number
    if (!parsed.amount || parsed.amount <= 0) {
      console.warn('⚠️ Invalid amount:', parsed.amount);
      return false;
    }

    // Date must be valid
    if (!parsed.date || isNaN(parsed.date.getTime())) {
      console.warn('⚠️ Invalid date:', parsed.date);
      return false;
    }

    // Type must be valid
    const validTypes = ['debit', 'credit', 'atm', 'cash', 'upi'];
    if (!validTypes.includes(parsed.type)) {
      console.warn('⚠️ Invalid type:', parsed.type);
      return false;
    }

    return true;
  }

  /**
   * Parse multiple SMS messages
   */
  static parseMultiple(smsList: RawSMS[]): ParsedSMS[] {
    const parsed: ParsedSMS[] = [];

    for (const sms of smsList) {
      const result = this.parse(sms);
      if (result && this.validate(result)) {
        parsed.push(result);
        console.log(`✅ Parsed: ${result.type} of Rs.${result.amount}`);
      } else {
        console.warn(`⚠️ Failed to parse SMS from ${sms.sender}`);
      }
    }

    return parsed;
  }
}
