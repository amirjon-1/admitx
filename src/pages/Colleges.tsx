import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  GraduationCap,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
} from 'lucide-react';

import { Header } from '../components/layout';
import { CollegeCard, AddCollegeModal } from '../components/dashboard';
import { Card, CardContent, Button, Input } from '../components/ui';
import { useStore } from '../store/useStore';
import type { College, CollegeStatus } from '../types';

import collegeStats from '../data/college_stats.json';
import collegeSupplements from '../data/college_supplements.json';

const STATUS_FILTERS: {
  value: CollegeStatus | 'all';
  label: string;
  icon: typeof CheckCircle;
}[] = [
  { value: 'all', label: 'All', icon: GraduationCap },
  { value: 'not_started', label: 'Not Started', icon: XCircle },
  { value: 'in_progress', label: 'In Progress', icon: Clock },
  { value: 'submitted', label: 'Submitted', icon: CheckCircle },
  { value: 'decided', label: 'Decided', icon: CheckCircle },
];

type CollegeStats = {
  sat_25_75?: string;
  act_25_75?: string;
  gpa_avg?: number;
  acceptance_rate?: string;
  class_size?: number;
};

type CollegeSupplement = {
  essays: string[];
  other_requirements: string[];
};

export function Colleges() {
  const navigate = useNavigate();
  const { colleges, addCollege } = useStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CollegeStatus | 'all'>('all');
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  const filteredColleges = colleges.filter((college) => {
    const matchesSearch = college.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || college.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const supplements: CollegeSupplement | undefined =
    selectedCollege
      ? (collegeSupplements as Record<string, CollegeSupplement>)[selectedCollege.name]
      : undefined;

  const stats: CollegeStats | undefined =
    selectedCollege
      ? (collegeStats as Record<string, CollegeStats>)[selectedCollege.name]
      : undefined;

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
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search colleges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColleges.map((college, index) => (
            <motion.div
              key={college.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="cursor-pointer"
              onClick={() => setSelectedCollege(college)}
            >
              <CollegeCard college={college} />
            </motion.div>
          ))}
        </div>
      </div>

      <AddCollegeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addCollege}
      />

      {/* Drawer */}
      {selectedCollege && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedCollege(null)}
          />

          <div
            className="relative ml-auto h-full w-full max-w-xl bg-white p-6 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-semibold">
                {selectedCollege.name}
              </h2>
              <Button size="sm" variant="secondary" onClick={() => setSelectedCollege(null)}>
                Close
              </Button>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div><strong>Status:</strong> {selectedCollege.status}</div>
              <div><strong>Decision:</strong> {selectedCollege.decisionType}</div>
              <div>
                <strong>Deadline:</strong>{' '}
                {selectedCollege.deadline
                  ? new Date(selectedCollege.deadline).toLocaleDateString()
                  : '—'}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">
                Admissions Statistics
              </h3>

              {!stats && (
                <p className="text-gray-500 text-sm">
                  No statistics available.
                </p>
              )}

              {stats && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {stats.sat_25_75 && (
                    <div><strong>SAT (25–75%):</strong> {stats.sat_25_75}</div>
                  )}
                  {stats.act_25_75 && (
                    <div><strong>ACT (25–75%):</strong> {stats.act_25_75}</div>
                  )}
                  {stats.gpa_avg && (
                    <div><strong>Avg GPA:</strong> {stats.gpa_avg}</div>
                  )}
                  {stats.acceptance_rate && (
                    <div><strong>Acceptance Rate:</strong> {stats.acceptance_rate}</div>
                  )}
                  {stats.class_size && (
                    <div><strong>Class Size:</strong> {stats.class_size}</div>
                  )}
                </div>
              )}

            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">
                Supplemental Essays (2025-26)
              </h3>

              {!supplements && (
                <p className="text-gray-500 text-sm">
                  No supplement information available.
                </p>
              )}

              {supplements && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Essays:</h4>
                    <ul className="space-y-2">
                      {supplements.essays.map((essay, idx) => (
                        <li
                          key={idx}
                          onClick={() =>
                            navigate('/essays', {
                              state: {
                                essay: essay,
                                college: selectedCollege.name,
                              },
                            })
                          }
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-start cursor-pointer group"
                        >
                          <span className="mr-2">•</span>
                          <span className="group-hover:underline flex-1">{essay}</span>
                          <ChevronRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </li>
                      ))}
                    </ul>
                  </div>

                  {supplements.other_requirements.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Other Requirements:</h4>
                      <ul className="space-y-2">
                        {supplements.other_requirements.map((req, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}