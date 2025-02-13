import { useFluent_unstable } from '@fluentui/react-shared-contexts';
import { TreeNavigationData_unstable } from '../Tree';
import type { TreeItemPropsReferences } from './useFlatTreeItems';
import { nextTypeAheadElement } from '../utils/nextTypeAheadElement';
import { HTMLElementWalker, useHTMLElementWalkerRef } from './useHTMLElementWalker';
import { treeDataTypes } from '../utils/tokens';
import { treeItemFilter } from '../utils/treeItemFilter';
import { useRovingTabIndex } from './useRovingTabIndexes';
import { useMergedRefs } from '@fluentui/react-utilities';

export function useFlatTreeNavigation(flatTree: Pick<TreeItemPropsReferences, 'get'>) {
  const { targetDocument } = useFluent_unstable();
  const [treeItemWalkerRef, treeItemWalkerRootRef] = useHTMLElementWalkerRef(treeItemFilter);
  const [{ rove }, rovingRootRef] = useRovingTabIndex(treeItemFilter);

  function getNextElement(data: TreeNavigationData_unstable) {
    if (!targetDocument || !treeItemWalkerRef.current) {
      return null;
    }
    const treeItemWalker = treeItemWalkerRef.current;
    switch (data.type) {
      case treeDataTypes.click:
        return data.target;
      case treeDataTypes.typeAhead:
        treeItemWalker.currentElement = data.target;
        return nextTypeAheadElement(treeItemWalker, data.event.key);
      case treeDataTypes.arrowLeft:
        return parentElement(flatTree, data.target, targetDocument);
      case treeDataTypes.arrowRight:
        treeItemWalker.currentElement = data.target;
        return firstChild(data.target, treeItemWalker);
      case treeDataTypes.end:
        treeItemWalker.currentElement = treeItemWalker.root;
        return treeItemWalker.lastChild();
      case treeDataTypes.home:
        treeItemWalker.currentElement = treeItemWalker.root;
        return treeItemWalker.firstChild();
      case treeDataTypes.arrowDown:
        treeItemWalker.currentElement = data.target;
        return treeItemWalker.nextElement();
      case treeDataTypes.arrowUp:
        treeItemWalker.currentElement = data.target;
        return treeItemWalker.previousElement();
    }
  }
  function navigate(data: TreeNavigationData_unstable) {
    const nextElement = getNextElement(data);
    if (nextElement) {
      rove(nextElement);
    }
  }
  return [navigate, useMergedRefs(treeItemWalkerRootRef, rovingRootRef)] as const;
}

function firstChild(target: HTMLElement, treeWalker: HTMLElementWalker): HTMLElement | null {
  const nextElement = treeWalker.nextElement();
  if (!nextElement) {
    return null;
  }
  const nextElementAriaPosInSet = nextElement.getAttribute('aria-posinset');
  const nextElementAriaLevel = nextElement.getAttribute('aria-level');
  const targetAriaLevel = target.getAttribute('aria-level');
  if (nextElementAriaPosInSet === '1' && Number(nextElementAriaLevel) === Number(targetAriaLevel) + 1) {
    return nextElement;
  }
  return null;
}

function parentElement(
  flatTree: Pick<TreeItemPropsReferences, 'get'>,
  target: HTMLElement,
  targetDocument: Document,
): HTMLElement | null {
  const item = flatTree.get(target.id);
  if (item && item.parentId) {
    return targetDocument.getElementById(item.parentId);
  }
  return null;
}
