import type { Translations } from './fa';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends readonly unknown[] ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

/**
 * English (prepared for a future release). Same key structure as `fa`; untranslated keys fall back to Persian.
 * To finish the English version, simply complete the remaining sections here.
 */
const en: DeepPartial<Translations> = {
  common: {
    currency: 'Toman', billion: 'B', million: 'M', thousand: 'K', today: 'Today', tomorrow: 'Tomorrow', yesterday: 'Yesterday',
    cancel: 'Cancel', confirm: 'Confirm', retry: 'Retry', selectDate: 'Select date', time: 'Time', hour: 'Hour', minute: 'Minute',
    minutes: 'min', month: 'month', session: 'session', save: 'Save', saved: 'Saved', deleted: 'Deleted', add: 'Add', edit: 'Edit',
    all: 'All', done: 'Done', continue: 'Continue', optional: 'optional', description: 'Description', date: 'Date', details: 'Details',
    seeAll: 'See all', calendar: 'Calendar', refresh: 'Refresh',
  },
  nav: { dashboard: 'Dashboard', students: 'Students', calendar: 'Calendar', classes: 'Classes', finance: 'Finance', myClasses: 'My classes', payments: 'Payments', training: 'Training' },
  calendar: {
    jalaliMonths: ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'],
    weekdaysShort: ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'],
    weekdays: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    day: 'Day', week: 'Week', month: 'Month', empty: 'No sessions on this day',
  },
  auth: {
    welcome: 'Tennis Coach', subtitle: 'Students, classes and tuition in one app', login: 'Sign in', register: 'Sign up',
    createAccount: 'Create account', registerSubtitle: 'Join as a coach or a student', identifier: 'Email or phone', password: 'Password',
    noAccount: 'No account?', haveAccount: 'Have an account?', firstName: 'First name', lastName: 'Last name', email: 'Email', phone: 'Phone',
    role: 'Role', coach: 'Coach', student: 'Student', registered: 'Welcome', demo: 'Demo accounts (password: Demo1234)',
    serverSettings: 'Server settings', serverUrl: 'API URL', serverHint: 'On a real phone use your computer LAN IP, e.g. http://192.168.1.10:8000/api/v1',
  },
  attendance: {
    status: { present: 'Present', absent: 'Absent', excused: 'Excused', unexcused: 'Unexcused', cancelled: 'Cancelled', makeup: 'Makeup' },
    reason: { illness: 'Illness', travel: 'Travel', personal: 'Personal', exam: 'Exam', miscommunication: 'Miscommunication', other: 'Other' },
  },
  classes: { type: { private: 'Private', semi_private: 'Semi private', group: 'Group', academy: 'Academy' } },
  finance: {
    status: { settled: 'Settled', partial: 'Partially paid', debt: 'Debt', overdue: 'Overdue', credit: 'Credit' },
    chargeStatus: { paid: 'Paid', partial: 'Partially paid', unpaid: 'Unpaid', overdue: 'Overdue' },
    method: { cash: 'Cash', card: 'Card', transfer: 'Transfer', other: 'Other' },
  },
  errors: { network_error: 'Cannot reach the server.', unknown_error: 'Something went wrong.', invalid_credentials: 'Wrong email/phone or password.' },
  subscription: {
    title: 'Coach Subscription',
    subtitle: 'Choose a subscription plan to unlock full features and use the app.',
    selectPlan: 'Select Subscription Plan',
    chooseDuration: 'Plan Duration',
    oneMonth: '1 Month',
    threeMonths: '3 Months',
    sixMonths: '6 Months',
    daysCount: '{{n}} Days Full Access',
    popularBadge: 'Most Popular',
    bestValueBadge: 'Best Value',
    starterBadge: 'Starter',
    savePercent: 'Save {{n}}%',
    featuresTitle: 'Plan Features',
    continueToPayment: 'Continue to Payment',
    currentPlan: 'Current Subscription',
    daysRemaining: '{{n}} Days Left',
    activeUntil: 'Active until {{date}}',
    noActiveSubscription: 'No active subscription',
    expired: 'Subscription expired',
    extendOrUpgrade: 'Renew or Upgrade',
    upgradePlan: 'Upgrade Plan',
    benefitsTitle: 'Why Tennis Coach?',
    checkout: {
      title: 'Checkout & Payment',
      orderSummary: 'Order Summary',
      planName: 'Selected Plan',
      duration: 'Duration',
      subtotal: 'Base Price',
      discount: 'Plan Discount',
      tax: 'VAT & Taxes',
      totalPayable: 'Total Payable',
      freeTax: 'Free',
      coachInfo: 'Coach Information',
      coachName: 'Full Name',
      coachPhone: 'Phone Number',
      coachEmail: 'Email',
      gatewayTitle: 'Payment Gateway',
      shaparakGateway: 'Shaparak Gateway (All Shetab Bank Cards)',
      simulatedNotice: 'Simulated payment gateway (direct banking connection coming soon)',
      securityGuarantee: 'Secure encrypted transaction',
      payAndActivate: 'Pay & Activate Subscription',
      processing: 'Processing transaction...',
      successTitle: 'Payment Successful!',
      successDesc: 'Your subscription has been successfully activated. You now have full access to all app features.',
      refNumber: 'Tracking Reference: {{ref}}',
      enterApp: 'Enter App Dashboard',
    },
  },
};

export default en;
