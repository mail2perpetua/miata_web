import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, FilterSelect, Pagination, SearchInput } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { ReferralTable } from '@/features/shared/ReferralTable';
import { REFERRAL_STATUS_OPTIONS } from '@/features/shared/referralStatus';
import { AgentStudentModal } from './AgentStudentModal';

/**
 * Agent's own referred students: search, status filter, pagination, view details. Increment `version` to reload (e.g. after
 * Apply Now).
 */
export function ReferredStudentsList({ query, apiQuery, update, setPage, setSort, version = 0 }) {
  const state = useFetch('/agent/students', apiQuery);
  const [viewing, setViewing] = useState(null);
  const { reload } = state;
  useEffect(() => {
    if (version) reload();
  }, [version, reload]);

  return (
    <>
      <div className="toolbar">
        <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search by name or ID…" />
        <FilterSelect
          label="Status"
          allLabel="All Status"
          value={query.status}
          onChange={(status) => update({ status })}
          options={REFERRAL_STATUS_OPTIONS}
        />
      </div>
      <ReferralTable
        state={state}
        query={query}
        onSort={setSort}
        actions={(r) => (
          <Button variant="secondary" size="sm" onClick={() => setViewing(r.studentId)}>
            View <ArrowRight aria-hidden="true" />
          </Button>
        )}
      />
      <Pagination meta={state.meta} onPage={setPage} noun="students" />
      {viewing && <AgentStudentModal studentId={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
