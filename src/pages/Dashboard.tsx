import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, GraduationCap } from 'lucide-react';
import { Header } from '../components/layout';
import {
  StatsOverview,
  CollegeCard,
  DeadlineTimeline,
  AddCollegeModal,
} from '../components/dashboard';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui';
import { useStore } from '../store/useStore';
import type { College } from '../types';

// Demo data for initial state
const DEMO_COLLEGES: College[] = [
  {
    id: '1',
    userId: 'demo',
    name: 'Stanford',
    deadline: new Date('2026-01-05'),
    decisionType: 'REA',
    applicationType: 'Common App',
    status: 'in_progress',
    result: null,
    createdAt: new Date(),
  },
  {
    id: '2',
    userId: 'demo',
    name: 'MIT',
    deadline: new Date('2026-01-01'),
    decisionType: 'EA',
    applicationType: 'Direct',
    status: 'submitted',
    result: null,
    createdAt: new Date(),
  },
  {
    id: '3',
    userId: 'demo',
    name: 'Harvard',
    deadline: new Date('2026-01-01'),
    decisionType: 'RD',
    applicationType: 'Common App',
    status: 'not_started',
    result: null,
    createdAt: new Date(),
  },
  {
    id: '4',
    userId: 'demo',
    name: 'Yale',
    deadline: new Date('2026-01-02'),
    decisionType: 'RD',
    applicationType: 'Common App',
    status: 'in_progress',
    result: null,
    createdAt: new Date(),
  },
  {
    id: '5',
    userId: 'demo',
    name: 'Princeton',
    deadline: new Date('2026-01-01'),
    decisionType: 'RD',
    applicationType: 'Common App',
    status: 'not_started',
    result: null,
    createdAt: new Date(),
  },
  {
    id: '6',
    userId: 'demo',
    name: 'Columbia',
    deadline: new Date('2026-01-01'),
    decisionType: 'ED',
    applicationType: 'Common App',
    status: 'decided',
    result: 'accepted',
    createdAt: new Date(),
  },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { colleges, essays, addCollege } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddCollege = (college: College) => {
    addCollege(college);
  };

  const handleCollegeClick = (college: College) => {
    navigate('/colleges', { state: { selectedCollege: college.name } });
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Track your college applications at a glance"
        action={{
          label: 'Add College',
          onClick: () => setIsAddModalOpen(true),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <div className="p-8 space-y-8">
        {/* Stats Overview */}
        <StatsOverview colleges={colleges} essays={essays} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colleges Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary-500" />
                  My Colleges
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </CardHeader>
              <CardContent>
                {colleges.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No colleges yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Start by adding the colleges you're applying to
                    </p>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First College
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {colleges.map((college, index) => (
                      <motion.div
                        key={college.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <CollegeCard
                          college={college}
                          onClick={() => handleCollegeClick(college)}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Deadlines */}
            <DeadlineTimeline colleges={colleges} />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add College
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/essays'}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Essay
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/voice'}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start Interview
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add College Modal */}
      <AddCollegeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCollege}
      />
    </div>
  );
}
