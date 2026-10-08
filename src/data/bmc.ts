// Business Model Canvas from the ActiveNutri Miro workshop board
// (template: Strategyzer AG, CC BY-SA 3.0). Transcribed note-for-note.

export type CanvasBlock = {
  id: string;
  title: string;
  prompt: string;
  tone: 'green' | 'teal' | 'violet' | 'yellow' | 'pink' | 'sky' | 'orange' | 'stone' | 'rose';
  headline: string[];
  notes: string[];
};

export const canvas: CanvasBlock[] = [
  {
    id: 'partners',
    title: 'Key Partners',
    prompt: 'What are your key partners to get competitive advantage?',
    tone: 'green',
    headline: [
      'SFA',
      'Board-certified nutritionists',
      'Singapore Health Promotion Board (HPB)',
      'Central kitchens',
      'OneMap',
      'Delivery partner',
      'Central kitchen / cloud kitchen',
    ],
    notes: [
      'Build partnerships with sports clubs, academies, and team managers to onboard athletes at scale.',
      'Integrate with nutritionists who can vet meal plans and approve menus for different training loads.',
      'Partner with meal prep kitchens that can produce athlete-specific portions reliably each day.',
      'Work with sports scientists or performance coaches to validate calorie and macro matching logic.',
      'Negotiate delivery partnerships that support timed drop-offs around training and recovery windows.',
    ],
  },
  {
    id: 'activities',
    title: 'Key Activities',
    prompt: 'What are the key steps to move ahead to your customers?',
    tone: 'teal',
    headline: [
      'Free samples of food products for 1st downloads',
      'Users take a photo of the meal so the app can give the nutrition values',
      'Allow for auto-booking bots',
    ],
    notes: [
      'Run a seamless booking platform for all sports-related activities.',
      'Maintain the meal recommendation engine that matches orders to training, expenditure and goals.',
      'Run quality-assurance checks on ingredients, portion sizes, and nutrition labelling before dispatch.',
      'Users are able to select post-meals that are beneficial to their recovery.',
      'Curate and update nutritionist-approved meal templates for endurance, strength, and recovery needs.',
      'Monitor athlete feedback and adjust meal suggestions based on performance, appetite, and adherence.',
      'Manage order orchestration between the app, kitchens, and delivery partners to keep meals on time.',
    ],
  },
  {
    id: 'resources',
    title: 'Key Resources',
    prompt: 'What resources do you need to make your idea work?',
    tone: 'violet',
    headline: ['Vending machines company', 'Logistics', 'Nutritionist'],
    notes: [
      'Use athlete profile data, training load inputs, and nutrition rules to personalise every recommendation.',
      'Use analytics to track demand patterns, popular meals, and athlete adherence across sessions.',
      'Maintain a vetted recipe and ingredient database approved by nutritionists for different sports.',
      'Keep a reliable mobile app and backend that can handle ordering, scheduling, and meal matching.',
    ],
  },
  {
    id: 'propositions',
    title: 'Value Propositions',
    prompt: 'How will you make your customers’ life happier?',
    tone: 'yellow',
    headline: [
      'Healthy food at your fingertips, without the hassle of meal prepping alone',
      'Convenient vending-machine collection near ActiveSG venues and gyms',
      'Users can now book all sports activities within this one app',
      'Users can pre-set their booking of courts and activities filled',
    ],
    notes: [
      'Calculating your daily nutritional needs based on fitness tracker and stats (age, weight, goals), then recommending meals that could fit.',
      'Meals that are nutritionally balanced and ready to eat, letting athletes recover without sacrificing taste or convenience.',
      'Offer personalised pre-ordering that saves athletes time while aligning meals to training load.',
      'Provide nutritionist-vetted meals that reduce guesswork and improve confidence in food choices.',
      'Help users hit recovery and performance targets with meals matched to energy expenditure.',
      'Make ordering frictionless with one-tap reordering, saved preferences, and training-day presets.',
      'Differentiate the app through athlete-specific meal planning rather than generic healthy delivery.',
    ],
  },
  {
    id: 'relationships',
    title: 'Customer Relationships',
    prompt: 'How often will you interact with your customers?',
    tone: 'pink',
    headline: ['Daily interactions', 'Monthly summary', 'Email vouchers / codes for discounts', 'App notifications', 'Referral links'],
    notes: [
      'Offer chat support for meal adjustments, substitutions, and nutrition questions from athletes.',
      'Send personalised reminders before training and recovery windows to encourage timely pre-orders.',
      'Use in-app onboarding to capture sport type, training schedule, dietary restrictions, and goals.',
      'Build loyalty with streak rewards for consistent ordering and adherence to nutrition plans.',
      'Collect post-meal ratings to improve recommendations and strengthen long-term user retention.',
    ],
  },
  {
    id: 'channels',
    title: 'Channels',
    prompt: 'How are you going to reach your customers?',
    tone: 'sky',
    headline: ['Instagram, Facebook, TikTok, XHS', 'Gym provider', 'Sport Singapore banners at sports stadiums'],
    notes: [
      'Support B2B sales to teams and organisations that want centralised athlete meal management.',
      'Enable direct in-app ordering with push notifications for training-day meal deadlines.',
      'Acquire users through partnerships with clubs, gyms, coaches, and sports performance centres.',
      'Use social media and athlete testimonials to demonstrate performance-focused meal convenience.',
      'Drive sign-ups through app stores, referral programmes, and team onboarding campaigns.',
    ],
  },
  {
    id: 'segments',
    title: 'Customer Segments',
    prompt: 'Who are your customers? Describe your target audience in a couple of words.',
    tone: 'orange',
    headline: [
      'People who are endeavouring to live healthier lifestyles and people who exercise',
      'People who want to eat healthy',
      'People who just exercised',
      'Senior citizens',
    ],
    notes: [
      'Focus on endurance athletes who require precise fuelling before and after long sessions.',
      'Target individual athletes who need convenient meals aligned with training and competition demands.',
      'Serve sports teams and clubs that want a shared nutrition solution for multiple players.',
      'Include strength and power athletes who need higher-protein meals matched to workload.',
      'Address amateur and semi-pro players who want professional-grade nutrition without a full-time chef.',
    ],
  },
  {
    id: 'costs',
    title: 'Cost Structure',
    prompt: 'How much are you planning to spend on product development and marketing for a certain period?',
    tone: 'stone',
    headline: [
      'Play Store commission cut',
      '$10,000 marketing (social media advertisement, print ads, etc.)',
      'Hosting server (Cloudflare $10.47/yr)',
      'Logistics $3,000',
    ],
    notes: [
      'Pay nutritionist review fees for meal vetting, menu design, and ongoing plan updates.',
      'Cover kitchen production costs, ingredient sourcing, and packaging for individualised meals.',
      'Budget for customer support, marketing acquisition, and delivery coordination overhead.',
      'Invest in app development, hosting, data storage, and recommendation engine maintenance.',
    ],
  },
  {
    id: 'revenue',
    title: 'Revenue Streams',
    prompt: 'How much are you planning to earn in a certain period? Compare your costs and revenues.',
    tone: 'rose',
    headline: [
      'Monthly subscription at S$1,000/month (your health is your true value)',
      'Commission cut from cloud kitchens',
      'Massage therapist commission cut',
      'Commission cuts for using bots within the app for booking',
      'Grant funding from SG Sports (startup funds)',
    ],
    notes: [
      'Charge subscription plans for recurring access to personalised meal ordering and nutrition support.',
      'Sell premium add-ons such as advanced performance analytics or one-on-one nutritionist consults.',
      'Offer team or club licensing fees for centralised access to athlete meal planning tools.',
      'Take a margin on each meal order based on preparation, vetting, and delivery value added.',
      'Generate revenue from sponsored healthy meal bundles that still meet nutritionist approval standards.',
    ],
  },
];

// Where each canvas block shows up in the product, so the board stays traceable.
export const canvasTrace: Record<string, string> = {
  partners: 'Stakeholder cards below, SFA/HPB footer, OneMap venue map',
  activities: 'Snap & Calculate, Court Booking Bot, meal recommendation from the recovery calculator',
  resources: 'Smart Dispenser network, nutritionist-vetted meal bento',
  propositions: 'Overview pillars, pod pickup, one-app venue booking, bot pre-set bookings',
  relationships: 'Get Started onboarding, PULSE-FIRST-SG voucher, streak counter',
  channels: 'Partner inquiry pipeline (B2B teams, gyms, clubs)',
  segments: 'Membership tiers: Community, Athlete, Academy',
  costs: 'Unit economics panel below',
  revenue: 'Four-pillar circular revenue model and Academy S$1,000 tier',
};
