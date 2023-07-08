import axios from 'axios';
import { format, addMonths } from 'date-fns';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button } from '@material-tailwind/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

import './App.css';

const App = () => {
  const [specialists, setSpecialists] = useState([]);
  const [municipalities, setMunicipalities] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [timedSearchActive, setTimedSearchActive] = useState(false);
  const lithuanianToEnglishMap = {
    Ą: 'A',
    Č: 'C',
    Ę: 'E',
    Ė: 'E',
    Į: 'I',
    Š: 'S',
    Ų: 'U',
    Ū: 'U',
    Ž: 'Z',
  };
  const searchRef = useRef(null);
  const filteredResults = useRef(null);

  useEffect(() => {
    setFilteredSpecialists(
      specialists?.filter(
        (specialist) =>
          search.length > 0 &&
          specialist?.fullName
            ?.toUpperCase()
            ?.replace(
              /[ĄČĘĖĮŠŲŪŽ]/g,
              (match) => lithuanianToEnglishMap[match] || match
            )
            ?.includes(
              search
                ?.toUpperCase()
                ?.replace(
                  /[ĄČĘĖĮŠŲŪŽ]/g,
                  (match) => lithuanianToEnglishMap[match] || match
                )
            )
      )
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, specialists]);

  useEffect(() => {
    axios
      .get('https://ipr.esveikata.lt/api/searchesNew/specialists')
      .then(({ data }) => setSpecialists(data.data));
    axios
      .get('https://ipr.esveikata.lt/api/searchesNew/municipalities')
      .then(({ data }) => setMunicipalities(data.data));
    axios
      .get('https://ipr.esveikata.lt/api/searchesNew/institutions')
      .then(({ data }) => setInstitutions(data.data));
  }, []);

  useEffect(() => {
    console.log(selectedSpecialist);
  }, [selectedSpecialist]);

  const handleClick = (event, id) => {
    // searchRef.value = event.target.innerText;
    setSearch(event.target.innerText);
    setSelectedSpecialist(
      filteredSpecialists.filter((specialist) => specialist.id === id).pop()
    );

    // setSelectedSpecialist(filteredSpecialists[key]);
    // console.log(searchRef.innerText, event.target.innerText);
  };

  const getTimeBounds = () => {
    const currentLithuaniaDate = new Date(
      new Date(Date.now()).toLocaleString('en-US', {
        timeZone: 'Europe/Vilnius',
      })
    );
    const currentLithuaniaTime = currentLithuaniaDate.getTime();
    const futureLithuaniaDate = addMonths(currentLithuaniaDate, 6);
    const futureLithuaniaTime = futureLithuaniaDate.getTime();

    console.log();
    return { leftBound: currentLithuaniaTime, rightBound: futureLithuaniaTime };
  };

  const getMunicipality = () => {
    const { istgId: institutionId } = selectedSpecialist?.institution.istgId;
    const selectedInstitution = institutions?.filter(
      (institution) => institution?.istgId === institutionId
    );
    return selectedInstitution?.municipalityId;
  };

  const handleTimedSearch = async () => {
    window.setInterval(() => handleSearch(), 1000);
  };

  const handleSearch = (event) => {
    // axios.post();

    const municipality = getMunicipality();
    const { leftBound, rightBound } = getTimeBounds();
    axios
      .get('https://ipr.esveikata.lt/api/searches/appointments/times', {
        params: {
          municipalityId: municipality,
          specialistId: selectedSpecialist.id,
          organizationId: selectedSpecialist.organizationId,
          leftBound: leftBound,
          rightBound: rightBound,
          page: 0,
          size: 50,
        },
      })
      .then((data) => setSearchResults(data.data.data));
  };

  return (
    <div className=''>
      <header className='bg-yellow-800 text-white font-bold h-12 flex items-center p-4 drop-shadow-md'>
        <h1 className=''>Registracija pas gydytoją</h1>
      </header>
      <div className='m-40'>
        <div className='w-full m-auto flex justify-center'>
          <div className='flex flex-col w-[36rem] md:w-[60rem] gap-6'>
            <div className='flex gap-2'>
              <div className='relative flex w-full'>
                <Input
                  inputRef={searchRef}
                  size='md'
                  label='Vardas'
                  color='indigo'
                  onChange={({ target }) => setSearch(target.value)}
                />
                <Button
                  size='sm'
                  color={search ? 'indigo' : 'blue-gray'}
                  disabled={!search}
                  className='!absolute right-1 top-1 rounded'
                  onClick={(event) => handleSearch(event)}
                >
                  Ieškoti
                </Button>
              </div>
              <Button
                variant='filled'
                color='orange'
                className='flex items-center gap-3 h-10'
                onClick={(event) => {
                  if (!timedSearchActive) {
                    setTimedSearchActive(true);
                    handleTimedSearch(event);
                  }
                }}
              >
                Tikrinti kas 5 minutes
                <ArrowPathIcon strokeWidth={2} className='h-5 w-5' />
              </Button>
            </div>
            <div ref={filteredResults} className='flex flex-col gap-1'>
              {filteredSpecialists.map((specialist, key) => (
                <button
                  id={specialist.id}
                  key={`specialist-${specialist.id}-${key}`}
                  type='button'
                  className='text-left border-2 rounded-md min-h-[52px] p-2'
                  onClick={(event) => handleClick(event, specialist.id)}
                >
                  {specialist.fullName}
                </button>
              ))}
            </div>
            <h2>{selectedSpecialist.fullName}</h2>
            <table>
              <thead>
                <tr>
                  <th>Paslauga</th>
                  <th>Įstaiga</th>
                  <th>Laikas</th>
                </tr>
              </thead>
              <tbody>
                {(searchResults?.length > 0 &&
                  searchResults?.map((result) => {
                    console.log(selectedSpecialist);
                    return (
                      <tr>
                        <td className='text-left'>
                          {result.healthcareServiceName ||
                            'Nerastas paslaugos pavadinimas'}
                        </td>
                        <td className='text-left'>
                          {result.organizationName ||
                            'Nerastas įstaigos pavadinimas'}
                        </td>
                        <td className='text-left'>
                          {format(
                            new Date(
                              new Date(result.earliestTime).toLocaleString(
                                'en-US',
                                {
                                  timeZone: 'Europe/Vilnius',
                                }
                              )
                            ),
                            'yyyy-MM-dd HH:mm'
                          ) || 'Nerastas anksčiausias laikas'}
                        </td>
                        <td className='text-left'>
                          <a
                            className='p-2 border-2 solid border-orange-600 rounded-md'
                            href={`https://ipr.esveikata.lt/available-registrations?organizationId=${result.organizationId}&serviceId=${result.healthcareServiceId}&practitionerId=${selectedSpecialist.id}&leftBound=${result.earliestTime}`}
                          >
                            Registruotis
                          </a>
                        </td>
                      </tr>
                    );
                  })) || (
                  <tr className='p-8'>
                    <td>Nerasta rezultatų</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
