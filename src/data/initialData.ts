import { Lead, Caller, CallLog } from '../types';

export const INITIAL_CALLERS: Caller[] = [
  { id: 'caller-1', name: 'Sarah Connor', avatar: '👩‍💼', color: 'orange', dailyGoal: 50, weeklyGoal: 250, monthlyGoal: 1000, yearlyGoal: 12000, role: 'caller' },
  { id: 'caller-2', name: 'Marcus Wright', avatar: '👨‍💻', color: 'indigo', dailyGoal: 50, weeklyGoal: 250, monthlyGoal: 1000, yearlyGoal: 12000, role: 'caller' },
  { id: 'caller-3', name: 'John Connor', avatar: '🥇', color: 'emerald', dailyGoal: 50, weeklyGoal: 250, monthlyGoal: 1000, yearlyGoal: 12000, role: 'caller' },
  { id: 'caller-4', name: 'Kyle Reese', avatar: '🏃', color: 'rose', dailyGoal: 50, weeklyGoal: 250, monthlyGoal: 1000, yearlyGoal: 12000, role: 'caller' },
  { id: 'caller-5', name: 'Ellen Ripley', avatar: '👩‍🎤', color: 'cyan', dailyGoal: 50, weeklyGoal: 250, monthlyGoal: 1000, yearlyGoal: 12000, role: 'admin' },
];

export const INITIAL_LEADS: Lead[] = [
  { id: 'lead-1', name: 'Alex Thompson', company: 'Nexus Logistics', phone: '+15550192834', status: 'New', industry: 'Logistics', jobTitle: 'Director of Transportation', email: 'alex.t@nexuslogistics.com', linkedinUrl: 'linkedin.com/in/alex-nexus-logistics', priorityScore: 92, isDncListed: false },
  { id: 'lead-2', name: 'Brooke Henderson', company: 'Cascade Real Estate', phone: '+15553820192', status: 'New', industry: 'Real Estate', jobTitle: 'Managing Partner', email: 'brooke.h@cascaderealty.com', linkedinUrl: 'linkedin.com/in/brooke-henderson-re', priorityScore: 85, isDncListed: false },
  { id: 'lead-3', name: 'Devon Miller', company: 'Ariel Solar Solutions', phone: '+15557283401', status: 'New', industry: 'Renewable Energy', jobTitle: 'VP of Business Development', email: 'devon@arielsolar.com', linkedinUrl: 'linkedin.com/in/devon-miller-solar', priorityScore: 78, isDncListed: false },
  { id: 'lead-4', name: 'Cassandra Wilde', company: 'Verdant Agritech', phone: '+15551982736', status: 'New', industry: 'Agriculture', jobTitle: 'Chief Operating Officer', email: 'cwilde@verdantagri.org', linkedinUrl: 'linkedin.com/in/cassandra-wilde-ag', priorityScore: 80, isDncListed: true }, // DNC listed for testing compliance checks!
  { id: 'lead-5', name: 'Ethan Hunt', company: 'IMF Security Consulting', phone: '+15554628391', status: 'New', industry: 'Cybersecurity', jobTitle: 'Principal Security Analyst', email: 'e.hunt@imfsec.net', linkedinUrl: 'linkedin.com/in/ethan-hunt-imf', priorityScore: 95, isDncListed: false },
  { id: 'lead-6', name: 'Elena Rostova', company: 'Novosibirsk Exports', phone: '+15554901827', status: 'New', industry: 'Manufacturing', jobTitle: 'Head of Global Trade', email: 'e.rostova@novoexports.com', linkedinUrl: 'linkedin.com/in/elena-rostova-exports', priorityScore: 64, isDncListed: false },
  { id: 'lead-7', name: 'James Carter', company: 'Prime Capital Partners', phone: '+15558192039', status: 'New', industry: 'Finance', jobTitle: 'Senior Investment Associate', email: 'jcarter@primecapital.com', linkedinUrl: 'linkedin.com/in/james-carter-investment', priorityScore: 88, isDncListed: false },
  { id: 'lead-8', name: 'Fiona Gallagher', company: 'South Side Renovations', phone: '+15553049182', status: 'New', industry: 'Construction', jobTitle: 'Owner / Chief Administrator', email: 'fiona@southsiderenos.com', linkedinUrl: 'linkedin.com/in/fiona-gallagher-construction', priorityScore: 70, isDncListed: false },
  { id: 'lead-9', name: 'Arthur Pendragon', company: 'Camelot Media Group', phone: '+15550293812', status: 'New', industry: 'Entertainment', jobTitle: 'General Manager', email: 'arthur@camelotmedia.co.uk', linkedinUrl: 'linkedin.com/in/arthur-pendragon-media', priorityScore: 75, isDncListed: false },
  { id: 'lead-10', name: 'Diana Prince', company: 'Themiscyra Antiquities', phone: '+15559483710', status: 'New', industry: 'Arts & Culture', jobTitle: 'Senior Curator of Antiquities', email: 'diana.prince@themiscyra.museum', linkedinUrl: 'linkedin.com/in/diana-prince-curator', priorityScore: 82, isDncListed: false },
  { id: 'lead-11', name: 'Tony Stark', company: 'Stark Industries SaaS', phone: '+15552918347', status: 'New', industry: 'Information Technology', jobTitle: 'Chief Software Architect', email: 'tony@stark.sh', linkedinUrl: 'linkedin.com/in/tony-stark-saas', priorityScore: 99, isDncListed: false },
  { id: 'lead-12', name: 'Bruce Wayne', company: 'Wayne Enterprise Tech', phone: '+15554839201', status: 'New', industry: 'Information Technology', jobTitle: 'Director of Applied Sciences', email: 'bwayne@wayne-corp.com', linkedinUrl: 'linkedin.com/in/bruce-wayne-tech', priorityScore: 96, isDncListed: false },
];

// Generates some initial call history to populate the analytics donut chart
// and lead daily volume leaderboard immediately on first render.
export const generateInitialHistory = (): CallLog[] => {
  const outcomes: ('Interested' | 'Not Interested' | 'Callback' | 'No Answer')[] = [
    'No Answer', 'Not Interested', 'Callback', 'Interested', 'No Answer', 'Interested', 'Callback'
  ];
  
  const leadNames = [
    { name: 'Apex Capital', phone: '+15550228391' },
    { name: 'Zenith Retail', phone: '+15559384729' },
    { name: 'Skyline Ventures', phone: '+15558493012' },
    { name: 'Blue Horizon Inc', phone: '+15552918831' },
    { name: 'Terra Nova Group', phone: '+15558127394' },
    { name: 'Cyberdyne Systems', phone: '+15559021021' },
    { name: 'Weyland-Yutani', phone: '+15552910398' },
  ];

  const logs: CallLog[] = [];
  const now = new Date();

  // Create logs spread over the last 2 days for the 5 callers
  let logIdCounter = 1;
  INITIAL_CALLERS.forEach((caller, callerIdx) => {
    // Generate between 15 and 45 background calls per caller to make charts realistic and dynamic
    const numCallsToday = 12 + Math.floor(Math.sin(callerIdx + 1) * 8) + (caller.id === 'caller-2' ? 32 : 10);
    const numCallsYesterday = 15 + Math.floor(Math.cos(callerIdx + 1) * 10);

    // Today's calls
    for (let i = 0; i < numCallsToday; i++) {
        const hOffset = Math.floor(Math.random() * 8); // 0-8 hours ago
        const mOffset = Math.floor(Math.random() * 60);
        const logDate = new Date(now.getTime() - (hOffset * 60 + mOffset) * 60 * 1000);
        const lead = leadNames[Math.floor(Math.random() * leadNames.length)];
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        const duration = outcome === 'Interested' ? 120 + Math.floor(Math.random() * 240) : 10 + Math.floor(Math.random() * 45);

        logs.push({
          id: `log-seed-${logIdCounter++}`,
          leadId: `lead-seed-${logIdCounter}`,
          leadName: `${lead.name} Contact`,
          phone: lead.phone,
          callerId: caller.id,
          callerName: caller.name,
          timestamp: logDate.toISOString(),
          outcome,
          notes: outcome === 'Interested' ? 'Spoke to decision-maker, highly interested in solar integration scheme.' : 'Busy signal or no reply.',
          duration,
          recordingLink: outcome === 'Interested' ? `https://storage.googleapis.com/recordings/call_${logIdCounter}.mp3` : undefined,
          webhookStatus: 'success'
        });
    }

    // Yesterday's calls
    for (let i = 0; i < numCallsYesterday; i++) {
      const hOffset = 24 + Math.floor(Math.random() * 8); // Yesterday
      const mOffset = Math.floor(Math.random() * 60);
      const logDate = new Date(now.getTime() - (hOffset * 60 + mOffset) * 60 * 1000);
      const lead = leadNames[Math.floor(Math.random() * leadNames.length)];
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      const duration = outcome === 'Interested' ? 95 + Math.floor(Math.random() * 150) : 12 + Math.floor(Math.random() * 30);

      logs.push({
        id: `log-seed-${logIdCounter++}`,
        leadId: `lead-seed-${logIdCounter}`,
        leadName: `${lead.name} Director`,
        phone: lead.phone,
        callerId: caller.id,
        callerName: caller.name,
        timestamp: logDate.toISOString(),
        outcome,
        notes: outcome === 'Interested' ? 'Wants a meeting scheduled next week.' : 'Not interested at this stage.',
        duration,
        recordingLink: undefined,
        webhookStatus: 'success'
      });
  }
  });

  return logs;
};
