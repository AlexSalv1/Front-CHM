import { useOutletContext } from 'react-router-dom';

export default function useAppContext() {
  return useOutletContext() || {
    session: null,
    canManageTeam: false,
    canManageInsumos: false,
    canManageManutencao: false,
    canViewFinancials: false,
    valuesHidden: false,
    maskValue: (value) => value,
  };
}
