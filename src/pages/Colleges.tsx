import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  GraduationCap,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Header } from '../components/layout';
import { CollegeCard, AddCollegeModal } from '../components/dashboard';
import { Card, CardContent, Button, Input, Badge } from '../components/ui';
import { useStore } from '../store/useStore';
import type { College, CollegeStatus } from '../types';

const STATUS_FILTERS: { value: CollegeStatus | 'all'; label: string; icon: typeof CheckCircle }[] = [
  { value: 'all', label: 'All', icon: GraduationCap },
  { value: 'not_started', label: 'Not Started', icon: XCircle },
  { value: 'in_progress', label: 'In Progress', icon: Clock },
  { value: 'submitted', label: 'Submitted', icon: CheckCircle },
  { value: 'decided', label: 'Decided', icon: CheckCircle },
];

export function Colleges() {
  const { colleges, addCollege } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CollegeStatus | 'all'>('all');

  const filteredColleges = colleges.filter((college) => {
    const matchesSearch = college.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || college.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddCollege = (college: College) => {
    addCollege(college);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Colleges"
        subtitle={`Tracking ${colleges.length} applications`}
        action={{
          label: 'Add College',
          onClick: () => setIsAddModalOpen(true),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <div className="p-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search colleges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
              >
                <filter.icon className="w-4 h-4 mr-1" />
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Colleges Grid */}
        {filteredColleges.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No colleges found'
                    : 'No colleges yet'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start by adding the colleges you\'re applying to'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First College
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredColleges.map((college, index) => (
              <motion.div
                key={college.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CollegeCard college={college} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AddCollegeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCollege}
      />
    </div>
  );
}
