declare namespace google.maps {
  namespace places {
    class Autocomplete {
      constructor(input: HTMLInputElement, options?: any);
      addListener(event: string, callback: () => void): void;
      getPlace(): any;
    }
  }
}
